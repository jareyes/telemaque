import store from "/js/store.mjs";

const STORE = "sentences";

// TODO: Attach audio to sentence

/* async */ function create({
    text_id,
    text_position,
    original,
    translation
    note,
}) {
    const sentence_id = crypto.randomUUID();
    const now_ms = Date.now();
    const sentence = {
        sentence_id,
        text_id,
        text_position,
        original,
        translation,
        note,

        // Set up literal and idiomatic translations
        words: [],
        phrases: [],

        // Add spaced repetition review statistics
        review: {
            easiness_factor: 2.5,
            interval_days: 1.0,
            streak: 0,
            last_review_ms: -Infinity,
            // Due immediately
            next_review_ms: now_ms,
            total_attempts: 0,
            total_errors: 0,
        },

        // Make room to cache audio
        audio: {},
        
        created_ms: now_ms,
        updated_ms: now_ms,
    };
    return store.add(STORE, sentence, "sentence_id");
}

/* async */ function get(sentence_id) {
    return store.get(STORE, sentence_id);
}

/* async */ function get_position(
    text_id,
    text_position,
) {
    return store.index_get(
        STORE,
        "text_position",
        [text_id, text_position],
    );
}

async function list(text_id) {
    const sentences = await store.search_index(
        STORE,
        "text_id",
        text_id,
    );
    sentences.sort(
        (x, y) => x.text_position - y.text_position
    );
    return sentences;
}

// TODO: Place literal translation of a particular word

// TODO: Mark idiomatic phrases

/* async */ function remove(sentence_id) {
    return store.delete(STORE, sentence_id);
}

/* async */ function update(sentence) {
    // TODO: Be more refined about this.
    // Update original text and translation only, perhaps
    // TODO: If original gets updated, handle literal
    // translations
    return store.update(STORE, sentence_id, sentence);
}

export default {
    create,    
    get,
    get_position,
    list,
    remove
};
