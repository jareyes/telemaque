import es_aesop from "/var/es_aesop.mjs";

export const VERSION = 10;

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

function install_language(
    database,
    transaction,
    language,
) {
    const language_code = language.language_code;
    // Create words store
    const words_id = `words:${language_code}`;
    if(!database.objectStoreNames.contains(words_id)) {
        database.createObjectStore(
            words_id,
            {keyPath: "word_id"},
        );
        console.log({
            event: "Migrations.CREATE_WORDS",
            store: words_id,
        });
    }

    // Create phrases store
    const phrases_id = `phrases:${language_code}`;
    if(!database.objectStoreNames.contains(phrases_id)) {
        database.createObjectStore(
            phrases_id,
            {keyPath: "phrase_id"},
        );
        console.log({
            event: "Migrations.CREATE_PHRASES",
            store: phrases_id,
        });
    }

    // Install the language
    const languages = transaction.objectStore("languages");
    const request = languages.put(language);
    console.log({
        event: "Migrations.INSTALL_LANGUAGE",
        language_code: language.language_code,
    });
}

function import_text(transaction, module) {
    // Insert text
    const {sentences, text, words} = module;
    const texts_tx = transaction.objectStore("texts");
    const text_id = text.text_id;
    const request = texts_tx.get(text_id);
    request.onsuccess = () => {
        const existing_text = request.result;
        if(existing_text) {
            console.debug({
                event: "Migrations.TEXT_EXISTS",
                text_id: existing_text.text_id,
            });
            return;
        }
        texts_tx.put(text);

        const sentences_tx = transaction.objectStore("sentences");
        for(const sentence of sentences) {
            sentences_tx.put(sentence);
        }

        const {
            language_code,
            text_id,
        } = text;
        const words_tx = transaction.objectStore(`words:${language_code}`);
        for(const word of words) {
            import_word(words_tx, word, text_id);
        }
        console.log({
            event: "Migrations.IMPORT_TEXT",
            text,
            sentence_count: sentences.length,
            word_count: words.length,
        });
    };
}

function import_word(words_tx, word, text_id) {
    const request = words_tx.get(word.word_id);
    request.onsuccess = () => {
        // Get the existing word
        const existing_word = request.result;
        // Totally new word. Add it wholesale
        if(existing_word === undefined) {
            return words_tx.put(word);
        }
        // Import all of the usages of this word
        const translations = word.translations;
        const existing_translations = existing_word.translations;
        for(const translation of translations) {
            const existing_translation = existing_translations.find(
                existing_translation => (
                    existing_translation.translation_id === translation.translation_id
                )
            );
            // Totally new translation. Add _it_ wholesale
            if(existing_translation === undefined) {
                existing_translations.push(translation);
            }
            // Check against the existing texts
            else {
                const text_ids = existing_translation.text_ids;
                // New text. Add it
                if(!text_ids.includes(text_id)) {
                    text_ids.push(text_id);
                }
            }
        }
        words_tx.put(existing_word);
    };
}

function install_greek(database, transaction) {
    const language = {
        language_code: "el",
        language_name: "Ελληνικά",

        voice_model_filepath: "/vendor/piper-voices/el/el_GR/rapunzelina/el_GR-rapunzelina-medium.onnx",
        voice_configuration_filepath: "/vendor/piper-voices/el/el_GR/rapunzelina/el_GR-rapunzelina-medium.onnx.json",

        installed_ms: Date.now(),
        word_count: 0,
        phrase_count: 0,
    };
    install_language(database, transaction, language);
}

function install_italian(database, transaction) {
    const language = {
        language_code: "it",
        language_name: "Italiano",

        voice_model_filepath: "/vendor/piper-voices/it/it_IT/riccardo/it_IT-riccardo-x_low.onnx",
        voice_configuration_filepath: "/vendor/piper-voices/it/it_IT/riccardo/it_IT-riccardo-x_low.onnx.json",

        installed_ms: Date.now(),
        word_count: 0,
        phrase_count: 0,
    };
    install_language(database, transaction, language);
}

function install_norwegian(database, transaction) {
    const language = {
        language_code: "no",
        language_name: "Norsk",

        voice_model_filepath: "/vendor/piper-voices/no/no_NO/talesyntese/no_NO-talesyntese-medium.onnx",
        voice_configuration_filepath: "/vendor/piper-voices/no/no_NO/talesyntese/no_NO-talesyntese-medium.onnx.json",
        installed_ms: Date.now(),
        word_count: 0,
        phrase_count: 0,
    };
    install_language(database, transaction, language);
}

function install_spanish(database, transaction) {
    const language = {
        language_code: "es",
        language_name: "Español",

        voice_model_filepath: "/vendor/piper-voices/es/es_MX/ald/es_MX-ald-medium.onnx",
        voice_configuration_filepath: "/vendor/piper-voices/es/es_MX/ald/es_MX-ald-medium.onnx.json",

        installed_ms: Date.now(),
        word_count: 0,
        phrase_count: 0,
    };
    install_language(database, transaction, language);
    import_text(transaction, es_aesop);
}

export function migrate(event) {
    const database = event.target.result;
    const transaction = event.target.transaction;

    create_texts(database);
    create_sentences(database);
    create_languages(database);
    install_italian(database, transaction);
    install_spanish(database, transaction);
    install_greek(database, transaction);
    install_norwegian(database, transaction);
}

export default {
    VERSION,
    migrate,
};
