import indexeddb from "/js/indexeddb.mjs";

export async function create({
    title,
    author,
    language="it",
    description,
}) {
    const text_id = crypto.randomUUID();
    const text = {
        text_id,
        title,
        author,
        language,
        description,
        created_ms: Date.now(),
        updated_ms: Date.now()
    };

    const store = await indexeddb.get("texts", "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.add(text);
        request.onsuccess = () => resolve(text_id);
        request.onerror = () => reject(request.error);
    });
}

export default {
    create,
};
