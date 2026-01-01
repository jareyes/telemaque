export const VERSION = 1;

function create_texts(database) {
    if(database.objectStoreNames.contains("texts")) {
        return;
    }
    const store = database.createObjectStore(
        "texts",
        {keyPath: "text_id"},
    );
    store.createIndex(
        "language_code",
        "language_code",
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

function create_languages(database) {
    if(database.objectStoreNames.contains("languages")) {
        return;
    }

    database.createObjectStore(
        "languages",
        {keyPath: "language_code"},
    );
    console.log({
        event: "Migrations.CREATE_LANGUAGES",
    });
}

function install_language(database, language) {
    const language_code = language.language_code;
    const words_id = `words:${language_code}`;
    if(database.objectStoreNames.contains(words_id)) {
        return;
    }

    // Create words store
    database.createObjectStore(
        words_id,
        {keyPath: "word_id"},
    );
    console.log({
        event: "Migrations.CREATE_WORDS",
        store: words_id,
    });

    // Create phrases store
    const phrases_id = `phrases:${language_code}`;
    database.createObjectStore(
        phrases_id,
        {keyPath: "phrase_id"},
    );
    console.log({
        event: "Migrations.CREATE_PHRASES",
        store: phrases_id,
    });

    // Install the language
    const languages_tx = database.transaction(
        ["languages"],
        "readwrite",
    );
    const languages = languages_tx.objectStore(
        "languages",
    );
    // TODO: How to propogate errors?
    const request = languages.add(language);
}

function install_italian(database) {
    const language = {
        language_code: "it",
        language_name: "Italiano",
        // Voice model
        voice_model_filepath: "/vendor/piper-phonemize/voices/it_IT-riccardo-x_low.onnx",
        voice_configuration_filepath: "/vendor/piper-phonemize/voices/it_IT-riccardo-x_low.onnx.json",

        installed_ms: Date.now(),
        word_count: 0,
        phrase_count: 0,
    };
    install_language(database, language);
}

export function migrate(event) {
    const database = event.target.result;
    create_texts(database);
    create_sentences(database);
    create_languages(database);
    install_italian(database);
}

export default {
    VERSION,
    migrate,
};
