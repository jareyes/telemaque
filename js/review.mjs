import sqlite from "/js/sqlite-client.mjs";

const REVIEW_LIMIT = 20;

function get_easiness(easiness, quality) {
    console.log("get_easiness", "easiness", easiness, "quality", quality);
    const penalty = quality - 5;
    return easiness +
        (0.1 - penalty * (0.08 + 0.02 * penalty));
}

function get_interval(
    easiness,
    quality,
    interval,
    streak,
) {
    console.log("easiness", easiness, "quality", quality, "interval", interval, "streak", streak);
    // Didn't do so hot. Reset the streak
    if(quality < 3) {
        return {interval: 1, streak: 0};
    }
    // Add another day to the streak
    streak++;

    // Starting out, let's do it again
    if(streak === 1) {
        return {interval: 1, streak};
    }
    // We're on a roll. Give it a break
    if(streak === 2) {
        return {interval: 6, streak};
    }
    // Review interval proportional to easiness
    const next_interval = Math.round(interval * easiness);
    return {interval: next_interval, streak};
}

export async function create({sentence_id}) {
    await sqlite.exec({
        sql: "INSERT INTO reviews (sentence_id) VALUES (?)",
        parameters: [sentence_id],
    });
    const rows = await sqlite.exec({
        sql: "SELECT last_insert_rowid() AS review_id",
    });
    return rows[0].review_id;
}

export async function get(sentence_id) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM reviews WHERE sentence_id = ?",
        parameters: [sentence_id],
    });
    return rows[0] ?? null;
}

export async function get_due(
    text_id,
    limit=REVIEW_LIMIT,
) {
    const rows = await sqlite.exec({
        sql: `SELECT r.*
              FROM sentences s
              JOIN reviews r
                ON s.sentence_id = r.sentence_id
              WHERE
                s.text_id = ? AND
                r.next_review_at <= datetime('now')
              ORDER BY r.next_review_at ASC
              LIMIT ?`,
        parameters: [text_id, limit],
    });
    return rows;
}

// https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
export async function record_attempts(
    sentence_id,
    attempts,
) {
    console.log("review", "record_attempts", "sentence_id", sentence_id, "attempts", attempts);
    // Get current state
    const review = await get(sentence_id);
    if(review === null) {
        throw RangeError(`No review for setence ${sentence_id}`);
    }
    console.log("review", review);

    // 1 attempt   = perfect (5)
    // 2 attempts  = good (4)
    // 3 attempts  = okay (3)
    // 4 attempts  = hard (2)
    // 5+ attempts = very hard (1)
    // TODO: Add a skipped (0)
    const quality = Math.max(
        1,
        Math.min(5, 6 - attempts),
    );

    const easiness = get_easiness(
        review.easiness_factor,
        quality,
    );
    const {interval, streak} = get_interval(
        easiness,
        quality,
        review.interval_days,
        review.repetitions,
    );
    const next_review = new Date();
    next_review.setDate(next_review.getDate() + interval);
    console.log("interval", interval, "next_review", next_review);

    await sqlite.exec({
        sql: `UPDATE reviews
              SET
                easiness_factor = ?,
                interval_days = ?,
                repetitions = ?,
                last_reviewed_at = datetime('now'),
                next_review_at = ?,
                total_attempts = total_attempts + ?,
                last_reviewed_at = datetime('now')
              WHERE sentence_id = ?`,
        parameters: [
            easiness,
            interval,
            streak,
            next_review.toISOString(),
            attempts,
            sentence_id,
        ],
    });

    return {
        quality,
        easiness_factor: easiness,
        interval_days: interval,
        repetitions: streak,
        next_review_at: next_review,
    };
}

export default {
    create,
    get,
    get_due,
    record_attempts,
};
