import indexeddb from "/js/indexeddb.mjs";

async function add(name, object, key) {
    const store = await indexeddb.get(name, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.add(object);
        const value = object[key];
        request.onsuccess = () => resolve(value);
        request.onerror = () => reject(request.error);
    });
}

async function _delete(name, key) {
    const store = await indexeddb.get(name, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

async function get(name, key) {
    const store = await indexeddb.get(name);
    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function get_all(name) {
    const store = await indexeddb.get(name);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function index_get(name, index_name, key) {
    const store = await indexeddb.get(name);
    return new Promise((resolve, reject) => {
        const index = store.index(index_name);
        const request = index.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function index_search(name, index_name, key) {
    const store = await indexeddb.get(name);
    return new Promise((resolve, reject) => {
        const index = store.index(index_name);
        const request = index.getAll(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function put(name, object) {
    const store = await indexeddb.get(name, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.put(object);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export default {
    add,
    "delete": _delete,
    get,
    get_all,
    index_get,
    index_search,
    put,
};
