// tts-client.mjs
let worker;
let msgId = 0;
const pending = new Map();

function initWorker() {
  if (worker) return;
  
  worker = new Worker("/js/tts-worker.mjs", { type: "module" });
  
  worker.onmessage = (event) => {
    const { id, result, error } = event.data;
    const promise = pending.get(id);
    
    if (!promise) {
      console.error("No pending promise for id:", id);
      return;
    }
    
    pending.delete(id);
    
    if (error) {
      promise.reject(new Error(error));
    } else {
      promise.resolve(result);
    }
  };
  
  worker.onerror = (error) => {
    console.error("Worker error:", error);
  };
}

/**
 * Speak the given text using Italian TTS
 * @param {string} text - The text to speak
 * @param {string} language - Language code (currently only 'it-IT' supported)
 * @returns {Promise<ArrayBuffer>} - WAV audio data
 */
export async function speak(text, language = "it-IT") {
  initWorker();
  
  const id = msgId++;
  const promise = new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
  
  worker.postMessage({ id, text, language });
  
  return promise;
}

/**
 * Speak text and play it immediately
 * @param {string} text - The text to speak
 * @param {string} language - Language code
 * @returns {Promise<HTMLAudioElement>} - The audio element playing the speech
 */
export async function speakAndPlay(text, language = "it-IT") {
  const wavBuffer = await speak(text, language);
  
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  
  // Clean up blob URL when audio finishes
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(url);
  });
  
  audio.play();
  return audio;
}