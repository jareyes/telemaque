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
            if(position === word.sentence_position) {
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
    constructor(
        sentence,
        word,
        $container,
        $form,
        $refresh_button,
        $submit_button,
        on_complete = (attempts) => {},
    ) {
        this.$container = $container;
        this.$form = $form;
        this.$refresh_button = $refresh_button;
        this.$submit_button = $submit_button;
        this.sentence = sentence;
        this.word = word;
        this.on_complete = on_complete;

        // Keep track of attempts
        this.attempts = 0;
        this.render();
    }

    render() {
        const sentence = this.sentence.original;
        const sentence_id = this.sentence.sentence_id;
        const word = this.word;
        const {start, end} = get_slice(
            sentence,
            this.word,
        );
        const $form = this.$form;
        const $refresh_button = this.$refresh_button;
        const $submit_button = this.$submit_button;
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
            // Each submission is an attempt
            this.attempts++;

            // Shall we play again?
            if(!$refresh_button.disabled) {
                window.location.href = `/html/sentence-cloze?sentence_id=${sentence_id}`;
                return;
            }

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

                $cloze_input.readOnly = true;
                this.on_complete(this.attempts);
                return;
            }
            // They got it wrong
            $cloze_input.classList.add("incorrect");
            $cloze_input.classList.remove("correct");
        });

        const $left = document.createElement("span");
        const $right = document.createElement("span");
        $left.textContent = sentence.slice(0, start);
        $right.textContent = sentence.slice(end);

        this.$container.replaceChildren(
            $left,
            $cloze_input,
            $right,
        );
        // Move focus to input
        $cloze_input.focus();
    }
}
