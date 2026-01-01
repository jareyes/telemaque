import store from "/js/store.mjs";

const STORE = "texts";

export /* async */ function create({
    title,
    author,
    language,
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
    return store.add(STORE, text, "text_id");
}

export /* async */ function get(text_id) {
    return store.get(STORE, text_id);
}

export async function list() {
    const texts = await store.get_all(STORE);
    // Sort reverse chronological order
    texts.sort((x, y) => y.created_ms - x.created_ms);
    return texts;
}

export /* async */ function remove(text_id) {
    return store.delete(STORE, text_id);
}

export /* async */ function update(text) {
    return store.put(STORE, text);
}

export default {
    create,
    get,
    list,
    remove,
    update
};
