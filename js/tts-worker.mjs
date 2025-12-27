// tts-worker.mjs
import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/esm/ort.min.js';
import createPiperPhonemize from "/vendor/piper-phonemize/piper_phonemize.js";

console.log("Initializing TTS worker");

ort.env.wasm.wasmPaths = '/vendor/onnxruntime-web@1.18.0/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;

let voiceModel;
let voiceConfig;

async function init() {
  voiceModel = await ort.InferenceSession.create(
    '/vendor/piper-phonemize/voices/it_IT-riccardo-x_low.onnx'
  );
  
    const configResponse = await fetch('/vendor/piper-phonemize/voices/it_IT-riccardo-x_low.onnx.json');
  voiceConfig = await configResponse.json();
    console.log("Voice config:", voiceConfig);
    
    self.postMessage({type: "ready"});
}

init().catch(console.error);

async function textToPhonemes(text) {
  // Format input as JSON like the library does
  const input = JSON.stringify([{ text: text.trim() }]);
  
  const phonemeIds = await new Promise(async (resolve, reject) => {
    const module = await createPiperPhonemize({
      print: (data) => {
        // piper-phonemize outputs JSON with phoneme_ids
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

    // Call with the voice from config
    module.callMain([
      "-l",
      voiceConfig.espeak.voice, // "it" for Italian
      "--input",
      input,
      "--espeak_data",
      "/espeak-ng-data",
    ]);
  });
  
  return phonemeIds;
}

function pcm2wav(pcm, channels, sampleRate) {
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
    const {text, language} = message;
  
  try {
    console.log("Synthesizing:", text);
    
    // Step 1: Get phoneme IDs
    const phonemeIds = await textToPhonemes(text);
    console.log("Phoneme IDs:", phonemeIds);
    
    // Step 2: Run through voice model
    const sampleRate = voiceConfig.audio.sample_rate;
    const noiseScale = voiceConfig.inference.noise_scale;
    const lengthScale = voiceConfig.inference.length_scale;
    const noiseW = voiceConfig.inference.noise_w;
    
    const feeds = {
      input: new ort.Tensor("int64", phonemeIds, [1, phonemeIds.length]),
      input_lengths: new ort.Tensor("int64", [phonemeIds.length]),
      scales: new ort.Tensor("float32", [noiseScale, lengthScale, noiseW]),
    };
    
    const { output } = await voiceModel.run(feeds);
    console.log("Generated audio, sample count:", output.data.length);
    
    // Step 3: Convert PCM to WAV
    const wavBuffer = pcm2wav(output.data, 1, sampleRate);
    
    // Send back as transferable ArrayBuffer
    self.postMessage({ 
        message_id,
        type: "wave",
        result: wavBuffer
    }, [wavBuffer]);
    
  } catch (error) {
    console.error("Synthesis error:", error);
      self.postMessage({message_id, type: "error", result: error.message });
  }
};
