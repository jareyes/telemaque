const CACHE_NAME = "telemaque-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/style.css",
    "/html/text-create.html",
    "/html/text-detail.html",
    "/html/text-update.html",
    "/img/arrow-back.svg",
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

// Intercept network calls. Try local storage first
// Then go out on the wire
async function fetch_strategy(request) {
    const cached_response = await caches.match(request);
    console.debug({
        event: "SW.FETCH",
        request,
        cached_response
    });
    if(cached_response !== undefined) {
        return cached_response;
    }
    return fetch(request);
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
self.addEventListener("fetch", event => {
    event.respondWith(fetch_strategy(event.request));
});
