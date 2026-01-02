import Sentence from "/js/sentence.mjs";
import Word from "/js/word.mjs";

const BOUNDARY_PATTERN = /(\s+|[.,;:!?"""''«»()—\-]+)/;

export function is_punctuation(token) {
    return BOUNDARY_PATTERN.test(token);
}

export function is_whitespace(token) {
    return /^\s+$/.test(token);
}

export function normalize(token) {
    return token.trim().toLowerCase();
}

export function is_word(token) {
    return !is_whitespace(token) && !is_punctuation(token);
}

export function tokenize(
    sentence,
    words_only=true
) {
    // Split on whitespace and punctuation
    let tokens = sentence.split(BOUNDARY_PATTERN);

    // Get rid of empty tokens
    tokens = tokens.filter(token => (token.length > 0));

    if(!words_only) {
        return tokens;
    }

    // Keep only words
    return tokens.filter(is_word);
}

export class Token {
    constructor(token, word) {
        this.token = token;
        this.word = word

        this.selected_translation = word?.
            translations?.
            [0]?.
            translation;
    }

    render() {
        // Capture this to use in event listeners
        const token = this;

        // Container for original and translation
        const $container = document.createElement("span");
        $container.classList.add("token");
        const $translation = document.createElement("span");
        $translation.classList.add("translation");

        // Add a place to type in a new translation
        const $input = document.createElement("input");
        $input.type = "text";
        $input.placeholder = "Translate";

        // Show the translation of existing words
        $input.value = token.selected_translation ?? "";

        // Listen for new translations
        $input.addEventListener("input", event => {
            const translation = event.target.value;
            token.selected_translation = translation;
        });

        // Attach the input
        $translation.appendChild($input);

        const $dropdown = document.createElement("select");
        const translations = token.word?.translations ??
              [];
        if(translations.length < 1) {
            $dropdown.disabled = true;
            $dropdown.classList.add("hidden");
        }
        for(let i = 0; i < translations.length; i++) {
            const word = translations[i];
            const $option = document.createElement("option");
            $option.value = i;
            $option.textContent = word.translation;
            $dropdown.appendChild($option);
        }
        
        $dropdown.addEventListener("input", event => {
            const idx = parseInt(event.target.value);
            token.selected_translation = translations[idx].translation;
            $input.value = token.selected_translation;
            console.debug({
                event: "Token.UPDATE",
                translation: token.selected_translation,
            });
        });
        $translation.appendChild($dropdown);

        const $original = document.createElement("span");
        $original.classList.add("base");
        $original.textContent = this.token;

        $container.appendChild($translation);
        $container.appendChild($original);

        return $container;
    }

    async save(
        language_code,
        sentence_id,
        sentence_position,
        text_id,
    ) {
        const translation = this.selected_translation;
        // If there's no translation, nothing to save
        if(translation === undefined) {
            return;
        }
        // Save the translation
        const original = normalize(this.token);
        const translation_id = await Word.add({
            original,
            translation,
            language_code,
            text_id,
        });
        // Place it in the sentence
        await Sentence.place({
            original,
            sentence_id,
            sentence_position,
            translation_id,
        });
    }
}

export default {
    Token,
    is_punctuation,
    is_whitespace,
    normalize,
    tokenize,
};
