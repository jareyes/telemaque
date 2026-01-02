import store from "/js/store.mjs";

function find_translation(
    word,
    translation,
    now_ms=Date.now(),
) {
    // Look for an existing translation
    const translations = word.translations;
    for(const entry of translations) {
        if(entry.translation === translation) {
            return entry;
        }
    }
    // Make a new one
    const original = word.original;
    const translation_id = `${original}:${translation}`;
    const entry = {
        translation_id,
        translation,
        text_ids: [],
        created_ms: now_ms,
    };
    // A little seedy that this function has a side-effect
    // but :fried-shrimp:
    translations.push(entry);
    return entry;
}

function get_store(language_code) {
    return `words:${language_code}`;
}

export async function add({
    original,
    translation,
    language_code,
    text_id,
    now_ms = Date.now(),
}) {
    const words_store = get_store(language_code);
    const preexisting_word = await store.get(
        words_store,
        original,
    );
    const word = preexisting_word ?? {
        // normalized word is the key
        word_id: original,
        original,
        translations: [],
        created_ms: now_ms,
    };
    // Record the update
    word.updated_ms = now_ms;
    
    const entry = find_translation(word, translation);
    // Record the association in this text
    if(!entry.text_ids.includes(text_id)) {
        entry.text_ids.push(text_id);
    }
    entry.updated_ms = now_ms;

    await store.put(words_store, word);
    return entry.translation_id;
}

export /* async */ function find(word, language_code) {
    const words_store = get_store(language_code);
    return store.get(words_store, word);
}

export default {
    add,
    find,
}
