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
    return token.toLowerCase();
}

export function tokenize(sentence, preserve_whitespace=false) {
    // Split on whitespace and punctuation
    let tokens = sentence.split(BOUNDARY_PATTERN);

    // Get rid of empty tokens
    tokens = tokens.filter(token => (token.length > 0));

    if(preserve_whitespace) {
        return tokens;
    }

    // Filter out the whitespace
    return tokens.filter(token => !is_whitespace(token));
}

export class Token {
    constructor(token, word, words) {
        this.token = token;
        this.word = word ?? {translation: null};
        this.words = words;
        this.normalized = normalize(token);
    }

    get is_capitalized() {
        return (this.token !== this.normalized);
    }

    get is_punctuation() {
        return is_punctuation(this.token);
    }

    render() {
        // Capture this to use in event listeners
        const token = this;

        // Container for original and translation
        const $container = document.createElement("span");
        $container.classList.add("token");
        if(this.is_punctuation) {
            $container.classList.add("punctuation");
            $container.textContent = this.token;
            if(this.word.translation === null) {
                this.word.translation = this.token;
            }
            return $container;
        }
        const $translation = document.createElement("span");
        $translation.classList.add("translation");

        // Add a place to type in a new translation
        const $input = document.createElement("input");
        $input.type = "text";
        $input.placeholder = "Translate";

        // Show the translation of existing words
        $input.value = this.word?.translation ?? "";

        // Listen for new translations
        $input.addEventListener("input", event => {
            const translation = event.target.value;
            token.word = {translation};
        });

        // Attach the input
        $translation.appendChild($input);

        const $dropdown = document.createElement("select");
        if(this.words.length < 1) {
            $dropdown.disabled = true;
            $dropdown.classList.add("hidden");
        }
        for(
            let translation_id = 0;
            translation_id < this.words.length;
            translation_id++
        ) {
            const word = this.words[translation_id];
            const $option = document.createElement("option");
            $option.value = translation_id;
            $option.textContent = word.translation;
            $dropdown.appendChild($option);
        }
        
        $dropdown.addEventListener("input", event => {
            const translation_id = parseInt(event.target.value);
            token.word = token.words[translation_id];
            $input.value = token.word.translation;
            console.debug({
                event: "Token.UPDATE",
                translation: token.word
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

    async save(sentence_id, position) {
        // If word is new, save it first
        if(this.word.word_id === undefined) {
            const word_id = await Word.add({
                original: this.normalized,
                translation: this.word.translation,
                is_punctuation: this.is_punctuation
            });
            this.word.word_id = word_id;
        }
        // Save sentence/word association
        const word_id = this.word.word_id;
        await Sentence.place({
            sentence_id,
            word_id,
            position,
            is_capitalized: this.is_capitalized,
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
