export const VERSION = 2;

function create_texts(database) {
    if(database.objectStoreNames.contains("texts")) {
        return;
    }
    const store = database.createObjectStore(
        "texts",
        {keyPath: "text_id"},
    );
    store.createIndex(
        "language",
        "language",
        {unique: false},
    );
    console.log({
        event: "Migrations.CREATE_TEXTS",
    });
}

function create_sentences(database) {
    if(database.objectStoreNames.contains("sentences")) {
        return;
    }
    const store = database.createObjectStore(
        "sentences",
        {keyPath: "sentence_id"},
    );
    // Find all the sentences for a given text easily
    store.createIndex(
        "text_id",
        "text_id",
        {unique: false},
    );
    // Find all sentences due for review easily
    store.createIndex(
        "next_review_ms",
        "review.next_review_ms",
        {unique: false},
    );
    // Find the sentence at a particular index
    store.createIndex(
        "text_position",
        ["text_id", "text_position"],
        {unique: true},
    );
    console.log({
        event: "Migrations.CREATE_SENTENCES",
    });
}

export function migrate(event) {
    const database = event.target.result;
    create_texts(database);
    create_sentences(database);
}

export default {
    VERSION,
    migrate,
};
