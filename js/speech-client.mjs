const TIMEOUT_MS = 30000;
const WORKER_URL = "/js/speech-worker.mjs";

const pending_messages = new Map();
const queued_messages = [];

const worker = new Worker(WORKER_URL, {type: "module"});
worker.is_ready = false;
worker.addEventListener("message", receive_message);
worker.addEventListener("error",  console.error);

function receive_message(event) {
    const {message_id, result, type} = event.data;

    if(type === "ready") {
        worker.is_ready = true;
        // Flush all the queued messages
        for(const message of queued_messages) {
            worker.postMessage(message);
        }
        console.log({
            event: "SpeechClient.READY"
        });
        return;
    }

    const promise = pending_messages.get(message_id);
    if(promise === undefined) {
        console.error({
            event: "SpeechClient.UNKNOWN_MESSAGE",
            message_id,
        });
        return;
    }

    pending_messages.delete(message_id);
    if(type === "error") {
        return promise.reject(new Error(result));
    }
    promise.resolve(result);
};

function send_message(message, type) {
    return new Promise((resolve, reject) => {
        const message_id = crypto.randomUUID();
        pending_messages.set(
            message_id,
            {resolve, reject},
        );
        const payload = {message_id, message, type};
        if(worker.is_ready) {
            worker.postMessage(payload);
        }
        else {
            queued_messages.push(payload);
        }
        setTimeout(
            () => {
                if(pending_messages.has(message_id)) {
                    pending_messages.delete(message_id);
                    reject(new Error("Timeout"));
                }
            },
            TIMEOUT_MS,
        );
    });
}

// @param {string} text - The text to speak
// @param {string} language - Language code (currently only 'it-IT' supported)
// @returns {Promise<ArrayBuffer>} - WAV audio data
export async function speak(text, language="it-IT") {
    return send_message({text, language});
}

// @param {string} text - The text to speak
// @param {string} language - Language code
// @returns {Promise<HTMLAudioElement>} - An audio element
export async function audio(text, language="it-IT") {
    const wav_buffer = await speak(text, language);
    const blob = new Blob(
        [wav_buffer],
        {type: "audio/wav"}
    );
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // Clean up blob URL when audio finishes
    audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
    });
    return audio;
}

export default {
    audio,
    speak,
};
