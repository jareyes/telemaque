import speech from "/js/speech-client.mjs";
import store from "/js/store.mjs";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STORE = "sentences";

export async function get_audio(
    sentence_id,
    language_code,
    now_ms=Date.now(),
) {
    const sentence = await get(sentence_id);

    // Grab it off the setence if we can
    const audio = sentence.audio;
    if(audio.buffer !== undefined) {
        return audio.buffer;
    }

    // Otherwise let's generate it
    const buffer = await speech.speak(
        sentence.original,
        language_code
    );
    // Cache it
    audio.buffer = buffer;
    audio.created_ms = now_ms;
    await update(sentence);

    // And send it back
    return buffer;
}

export async function create({
    text_id,
    text_position,
    original,
    translation,
    note,
}) {
    const sentence_id = crypto.randomUUID();
    const now_ms = Date.now();
    const sentence = {
        sentence_id,
        text_id,
        text_position,
        original,
        translation,
        note,

        // Set up literal and idiomatic translations
        words: [],
        phrases: [],

        // Add spaced repetition review statistics
        review: {
            easiness_factor: 2.5,
            interval_days: 1.0,
            streak: 0,
            last_review_ms: -Infinity,
            // Due immediately
            next_review_ms: now_ms,
            total_attempts: 0,
            total_errors: 0,
        },

        // Make room to cache audio
        audio: {},

        created_ms: now_ms,
        updated_ms: now_ms,
    };
    return store.add(STORE, sentence, "sentence_id");
}

export /* async */ function get(sentence_id) {
    return store.get(STORE, sentence_id);
}

export /* async */ function get_position(
    text_id,
    text_position,
) {
    return store.index_get(
        STORE,
        "text_position",
        [text_id, text_position],
    );
}

export async function list(text_id) {
    const sentences = await store.index_search(
        STORE,
        "text_id",
        text_id,
    );
    sentences.sort(
        (x, y) => x.text_position - y.text_position
    );
    return sentences;
}

export async function place({
    original,
    sentence_id,
    sentence_position,
    translation_id,
}) {
    const sentence = await get(sentence_id);
    if(sentence === undefined) {
        throw new RangeError(`Sentence not found: ${sentence_id}`);
    }
    // Add the word to the sentence
    sentence.words.push({
        original,
        translation_id,
        sentence_position,
    });
    await update(sentence);
}

// TODO: Mark idiomatic phrases

export async function record_attempts(
    sentence_id,
    attempts,
    now_ms=Date.now(),
) {
    const sentence = await get(sentence_id);
    if (sentence === undefined) {
        throw new RangeError(`Sentence not found: ${sentence_id}`);
    }

    // 1 attempt = perfect (5)
    // 2 attempts = good (4)
    // 3 attempts = okay (3)
    // 4 attempts = hard (2)
    // 5+ attempts = very hard (1)
    const quality = Math.max(1, Math.min(5, 6 - attempts));

    // Update review statistics
    // https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
    const review = sentence.review;

    // Update easiness factor
    const penalty = quality - 5;
    review.easiness_factor = review.easiness_factor +
        (0.1 - penalty * (0.08 + 0.02 * penalty));

    // Didn't do so hot. Reset the streak
    if(quality < 3) {
        review.interval_days = 1;
        review.streak = 0;
        review.total_errors++;
    }
    else {
        // We're on a streak
        review.streak++;
        const streak = review.streak;
        const interval = review.interval;
        const easiness = review.easiness_factor;
        // Starting out, let's do it again
        if(streak === 1) {
            review.interval_days = 1;
        }
        // We're on a roll. Give it a break
        else if(streak === 2) {
            review.interval_days = 6;
        }
        // Review again in a time proporitional to easiness
        else {
            review.interval_days = Math.round(
                interval * easiness
            );
        }
    }

    // Update timestamps
    review.last_review_ms = now_ms;
    review.next_review_ms = now_ms + (
        review.interval_days * MS_PER_DAY
    );
    review.total_attempts += attempts;

    // Save updated sentence
    await update(sentence);

    return review;
}

export /* async */ function remove(sentence_id) {
    return store.delete(STORE, sentence_id);
}

export /* async */ function update(
    sentence,
    now_ms=Date.now(),
) {
    sentence.updated_ms = now_ms;
    return store.put(STORE, sentence);
}

export default {
    create,
    get,
    get_audio,
    get_position,
    list,
    place,
    record_attempts,
    remove
};
