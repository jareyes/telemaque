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
        const word = this.word;
        const {start, end} = get_slice(
            sentence,
            this.word,
        );
        const $form = document.createElement("form");
        const $submit_button = document.createElement("button");
        $submit_button.type = "submit";
        $submit_button.textContent = "Check";

        const $cloze_input = document.createElement("input");
        $cloze_input.type = "text";
        $cloze_input.classList.add("cloze");
        $cloze_input.style.width = `${this.word.original.length+1}ch`;
        $cloze_input.addEventListener("input", (event) => {
            $cloze_input.classList.remove("correct");
            $cloze_input.classList.remove("incorrect");
            $submit_button.disabled = false;
        });


        $form.addEventListener("submit", (event) => {
            event.preventDefault();
            // Can't check again until you change your
            // submission
            $submit_button.disabled = true;
            
            const submission = $cloze_input.
                  value.
                  trim().
                  toLowerCase();
            const answer = word.original.toLowerCase();
            // They got it right!
            if(submission === answer) {
                $cloze_input.classList.add("correct");
                $cloze_input.classList.remove("incorrect");
                $cloze_input.disabled = true;
                $submit_button.textContent = "Correct!";
                return;
            }
            // They got it wrong
            $cloze_input.classList.add("incorrect");
            $cloze_input.classList.remove("correct");
        });
        
        const $left = document.createElement("span");
        $left.textContent = sentence.slice(0, start);

        const $right = document.createElement("span");
        $right.textContent = sentence.slice(end);

        $form.append(
            $left,
            $cloze_input,
            $right,
            $submit_button,
        );
        this.$container.replaceChildren($form);
        // Move focus to input
        $cloze_input.focus();
    }
}
