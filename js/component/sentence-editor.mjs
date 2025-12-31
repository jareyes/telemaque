import Review from "/js/review.mjs";
import Sentence from "/js/sentence.mjs";
import Text from "/js/text.mjs";
import {
    normalize,
    tokenize,
    Token,
} from "/js/component/token.mjs";
import Word from "/js/word.mjs";


export default class SentenceEditor {
    constructor(
        text_id,
        $sentence_input,
        $words_container,
    ) {
        this.$sentence_input = $sentence_input;
        this.$words_container = $words_container;
        this.$tokens = [];

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
        console.log("sentence", sentence, "tokens", tokens);

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
        const original = this.$sentence_input.value;
        const sentence_position = await Text.sentence_count(text_id);
        const sentence_id = await Sentence.create({
            text_id,
            position: sentence_position,
            original,
            translation,
            note,
        });

        // Add to review schedule
        await Review.create({sentence_id});

        // Process them one-by-one
        for(let i = 0; i < this.$tokens.length; i++) {
            const $token = this.$tokens[i];
            const position = i;
            await $token.save(sentence_id, position);
        }
        return sentence_id;
    }
}
