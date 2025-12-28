import {
    is_whitespace,
    tokenize,
} from "/js/component/token.mjs";

function get_slice(original, word) {
    // Tokenize, but keep the whitespace
    const tokens = tokenize(original, true);

    // Starting with the first token position in the
    // sentence
    let position = 0;
    // And first character in the string
    let idx = 0;
    for(let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if(!is_whitespace(token)) {
            if(position === word.position) {
                // We're here! Note the character index
                const start = idx;
                const end = idx + token.length;
                return {start, end};
            }
            position++;
        }
        idx += token.length;
    }
    throw RangeError("Token not found");
}


export default class Cloze {
    constructor(sentence, word, $container) {
        this.$container = $container;
        this.sentence = sentence;
        this.word = word;
    }

    render() {
        const sentence = this.sentence.original;
        const {start, end} = get_slice(
            sentence,
            this.word,
        );

        const $left = document.createElement("span");
        $left.textContent = sentence.slice(0, start);

        const $cloze_input = document.createElement("input");
        $cloze_input.type = "text";
        $cloze_input.classList.add("cloze");
        // Size it to be about the same character length as
        // the word
        $cloze_input.style.width = `${this.word.original.length}ch`;
//        const $cloze = document.createElement("span");
//        $cloze.style.color = "blue";
//        $cloze.textContent = sentence.slice(start, end);

        const $right = document.createElement("span");
        $right.textContent = sentence.slice(end);

        this.$container.replaceChildren(
            $left, $cloze_input, $right,
        );
        // Move focus to input
        $cloze_input.focus();
    }
}
