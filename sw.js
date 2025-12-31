const CACHE_NAME = "telemaque-v1";
const ASSETS = [
    "/",
    "/manifest.json",
    "/css/style.css",
    "/html/sentence-cloze",
    "/html/sentence-create",
    "/html/sentence-detail",
    "/html/sentence-play",
    "/html/sentence-present",
    "/html/text-create",
    "/html/text-detail",
    "/html/text-update",
    "/img/arrow-back.svg",
    "/js/migrate.mjs",
    "/js/review.mjs",
    "/js/sentence.mjs",
    "/js/speech-client.mjs",
    "/js/speech-worker.mjs",
    "/js/sqlite-client.mjs",
    "/js/sqlite-worker.mjs",
    "/js/text.mjs",
    "/js/word.mjs",
    "/js/component/cloze.mjs",
    "/js/component/sentence-editor.mjs",
    "/js/component/token.mjs",
    "/vendor/onnxruntime-web@1.18.0/ort.min.js",
    "/vendor/onnxruntime-web@1.18.0/ort-wasm-simd-threaded.wasm",
    "/vendor/onnxruntime-web@1.18.0/ort-wasm-simd-threaded.worker.js",
    "/vendor/onnxruntime-web@1.18.0/ort-wasm-simd.wasm",
    "/vendor/onnxruntime-web@1.18.0/ort-wasm-threaded.wasm",
    "/vendor/onnxruntime-web@1.18.0/ort-wasm-threaded.worker.js",
    "/vendor/onnxruntime-web@1.18.0/ort-wasm.wasm",
    "/vendor/piper-phonemize/piper_phonemize.js",
    "/vendor/piper-phonemize/piper_phonemize.wasm",
    "/vendor/piper-phonemize/piper_phonemize.data",
    "/vendor/piper-phonemize/voices/it_IT-riccardo-x_low.onnx",
    "/vendor/piper-phonemize/voices/it_IT-riccardo-x_low.onnx.json",
    "/vendor/sqlite-wasm-3510100/jswasm/sqlite3.mjs",
    "/vendor/sqlite-wasm-3510100/jswasm/sqlite3.wasm",
    "/vendor/sqlite-wasm-3510100/jswasm/sqlite3-opfs-async-proxy.js",
];

async function cleanup(current_name) {
    try {
        const cache_names = await caches.keys();
        for(const cache_name of cache_names) {
            if(cache_name === current_name) {
                continue;
            }
            await caches.delete(cache_name);
            console.log({
                event: "SW.CLEANUP",
                cache_name,
            });
        }
    }
    catch(err) {
        console.error({
            event: "SW.CLEANUP",
            err
        });
    }
}

// Intercept network calls. 
async function fetch_strategy(request) {
    // Try local storage first
    const cached_response = await caches.match(request);
    if(cached_response !== undefined) {        
        return cached_response;
    }
    // Then go out on the wire
    const response = fetch(request);
    console.debug({
        event: "SW.FETCH",
        url: request.url,
        status_code: response.status,
    });
    return response;
}

async function precache(cache_name, assets) {
    const cache = await caches.open(cache_name);
    await cache.addAll(assets);
    console.log({
        event: "SW.PRECACHE",
        cache: cache_name,
        assets: assets,
    });
}

// Upon install cache the assets
self.addEventListener("install", event => {
    console.log({event: "SW.INSTALL"});
    event.waitUntil(precache(CACHE_NAME, ASSETS));
});

// Clean up the old ones
self.addEventListener("activate", event => {
    console.log({event: "SW.ACTIVATE"});
    event.waitUntil(cleanup(CACHE_NAME));
});

// Handle network requests internally
// TODO: Disabled for development. Put back
 self.addEventListener("fetch", event => {
    event.respondWith(fetch_strategy(event.request));
});
