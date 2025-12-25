import * as sqlite from "/js/sqlite-client.mjs";
import * as Sentence from "/js/sentence.mjs";
import * as Text from "/js/text.mjs";
import * as Word from "/js/word.mjs";

const BOUNDARY_PATTERN = /(\s+|[.,;:!?"""''«»()—\-]+)/;

function is_punctuation(token) {
    return BOUNDARY_PATTERN.test(token);
}

function normalize(token) {
    return token.toLowerCase();
}

function tokenize(sentence) {
    // Split on whitespace and punctuation
    const tokens = sentence.split(BOUNDARY_PATTERN);

    // Filter out the whitespace
    return tokens.filter(token =>
        token.length > 0 && !/^\s+$/.test(token)
    );
}

class Token {
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
        $container.classList.add("word");
        
        const $translation = document.createElement("span");
        $translation.classList.add("literal");
        
        if(this.words.length > 0) {
            const $dropdown = document.createElement("select");
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
            
            $dropdown.addEventListener("change", event => {
                const translation_id = parseInt(event.taget.value);
                token.word = token.words[translation_id];
                console.debug({
                    event: "Token.UPDATE",
                    translation: token.word
                });
            });
            $translation.appendChild($dropdown);
        }
        
        // Add a place to type in a new translation
        // TODO: Make this available always for all words
        // for new usages
        const $input = document.createElement("input");
        $input.type = "text";
        $input.placeholder = "Translation";
        
        // Show the translation of existing words
        $input.value = this.word?.translation ?? "";
        
        // Listen for new translations
        $input.addEventListener("input", event => {
            const translation = event.target.value;
            token.word = {translation};
            console.log("token", token);
        });
        
        // Attach the input
        $translation.appendChild($input);
        
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

export default class SentenceEditor {
    constructor(text_id, $container) {
        this.$container = $container;
        this.$sentence_input = null;
        this.$tokens = [];
        this.text_id = text_id;
        this.word_cache = new Map();

        // Create document elements
        const $sentence_input = document.createElement(
            "input",
        );
        $sentence_input.type = "text";
        $sentence_input.placeholder = "Type the next sentence";
        $sentence_input.addEventListener(
            "input",
            () => this.update(),
        );

        const $words_container = document.createElement(
            "div",
        );

        // Attach them to the page
        $container.appendChild($sentence_input);
        $container.appendChild($words_container);

        this.$sentence_input = $sentence_input;
        this.$words_container = $words_container;
    }

    async update() {
        const sentence = this.$sentence_input.value;
        const tokens = tokenize(sentence);

        // Load words for each token into the cache
        const $tokens = [];
        for(const token of tokens) {
            const normalized = normalize(token);
            // Fetch new words
            if(!this.word_cache.has(normalized)) {
                const words = await Word.find(normalized);
                this.word_cache.set(normalized, words);
            }
            const words = this.word_cache.get(normalized);
            const word = words[0] ?? null;
            const $token = new Token(token, word, words);
            $tokens.push($token);
        }

        this.$tokens = $tokens;
        // Render the UI
        this.$words_container.replaceChildren(
            ...$tokens.map($token => $token.render())
        );
    }

    async save(translation=null, note=null) {
        // TODO: Wrap this all in a transaction
        // Save the sentence
        const text_id = this.text_id;
        const sentence_position = await Text.sentence_count(text_id);
        const sentence_id = await Sentence.create({
            text_id,
            position: sentence_position,
            translation,
            note,
        });

        // Process them one-by-one
        for(let i = 0; i < this.$tokens.length; i++) {
            const $token = this.$tokens[i];
            const position = i;
            await $token.save(sentence_id, position);
        }
        return sentence_id;
    }
}

SentenceEditor.tokenize = tokenize;
