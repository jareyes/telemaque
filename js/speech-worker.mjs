// TODO: Clean this mess up. (Yes, Claude did write it)
import Language from "/js/language.mjs";
import * as ort from "/vendor/onnxruntime-web@1.18.0/ort.min.js";
import createPiperPhonemize from "/vendor/piper-phonemize/piper_phonemize.js";

// Set up onnx runtime environment variables
ort.env.wasm.wasmPaths = "/vendor/onnxruntime-web@1.18.0/";
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;

async function phonemize(text, espeak_voice) {
    console.log("text", text, "espeak_voice", espeak_voice);
    const input = JSON.stringify([{text: text.trim()}]);
    const phoneme_ids = await new Promise(async (resolve, reject) => {
        const module = await createPiperPhonemize({
            print: (data) => {
                // piper-phonemize outputs JSON with phoneme_ids
                console.log("data", data);
                resolve(JSON.parse(data).phoneme_ids);
            },
            printErr: (message) => {
                reject(new Error(message));
            },
            locateFile: (url) => {
                if (url.endsWith(".wasm")) return "/vendor/piper-phonemize/piper_phonemize.wasm";
                if (url.endsWith(".data")) return "/vendor/piper-phonemize/piper_phonemize.data";
                return url;
            },
        });
        
        // Call with the voice from configuration
        module.callMain([
            "-l",
            espeak_voice,
            "--input",
            input,
            "--espeak_data",
            "/espeak-ng-data",
        ]);
    });
    return phoneme_ids;
}

// Convert from PCM to WAV
function convert(pcm, channels, sampleRate) {
  const bytesPerSample = 4; // 32-bit float
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 3, true); // IEEE float
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    view.setFloat32(offset + i * 4, pcm[i], true);
  }

  return buffer;
}

self.onmessage = async (event) => {
    const {message_id, message, type} = event.data;
    try {
        const {text, language_code} = message;
        const language = await Language.get(language_code);
        const voice_model = await ort.InferenceSession.create(language.voice_model_filepath);
        const configuration_response = await fetch(language.voice_configuration_filepath);
        const voice_configuration = await configuration_response.json();
        console.debug({
            event: "SpeechWorker.VOICE_MODEL",
            voice_configuration,
        });
        const espeak_voice = voice_configuration.espeak.voice;
        const phoneme_ids = await phonemize(text, espeak_voice);
        console.debug({
            event: "SpeechWorker.PHONEMES",
            phoneme_ids,
        });
        
        // Step 2: Run through voice model
        const sample_rate = voice_configuration.audio.sample_rate;
        const noise_scale = voice_configuration.inference.noise_scale;
        const length_scale = voice_configuration.inference.length_scale;
        const noise_w = voice_configuration.inference.noise_w;
        
        const feeds = {
            input: new ort.Tensor("int64", phoneme_ids, [1, phoneme_ids.length]),
            input_lengths: new ort.Tensor("int64", [phoneme_ids.length]),
            scales: new ort.Tensor("float32", [noise_scale, length_scale, noise_w]),
        };
        
        const {output} = await voice_model.run(feeds);
        console.debug({
            event: "SpeechWorker.AUDIO",
            sample_count: output.data.length,
        });
        
        // Step 3: Convert PCM to WAV
        const buffer = convert(output.data, 1, sample_rate);
        
        // Send back as transferable ArrayBuffer
        self.postMessage({ 
            message_id,
            type: "wave",
            result: buffer
        }, [buffer]);
        
    } catch (err) {
        console.error({
            event: "SpeechWorker.SYNTHESIZE",
            error: err.name,
            stack: err.stack,
        });         
        self.postMessage({
            message_id,
            type: "error",
            result: err.message,
        });
    }
};

self.postMessage({type: "ready"});
