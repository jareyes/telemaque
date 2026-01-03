import Sentence from "/js/sentence.mjs";
import Text from "/js/text.mjs";
import {
    normalize,
    tokenize,
    Token,
} from "/js/token.mjs";
import Word from "/js/word.mjs";

export default class SentenceEditor {
    constructor(
        language_code,
        text_id,
        $sentence_input,
        $words_container,
    ) {
        this.$sentence_input = $sentence_input;
        this.$words_container = $words_container;
        this.$tokens = [];

        this.language_code = language_code;
        this.text_id = text_id;
        this.word_cache = new Map();

        $sentence_input.addEventListener(
            "input",
            () => this.update(),
        );
        this.update();
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
                const words = await Word.find(
                    normalized,
                    this.language_code,
                );
                this.word_cache.set(normalized, words);
            }
            const word = this.word_cache.get(normalized);
            const $token = new Token(token, word);
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
        const original = this.$sentence_input.value;
        const text_position = await Text.next_position(
            text_id,
        );
        const sentence_id = await Sentence.create({
            text_id,
            text_position,
            original,
            translation,
            note,
        });

        // Process them one-by-one
        for(let i = 0; i < this.$tokens.length; i++) {
            const $token = this.$tokens[i];
            const sentence_position = i;
            await $token.save(
                this.language_code,
                sentence_id,
                sentence_position,
                text_id,
            );
        }
        return sentence_id;
    }
}
