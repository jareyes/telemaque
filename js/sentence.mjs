import * as sqlite from "/js/sqlite.mjs"

const BOUNDARY_PATTERN = /(\s+|[.,;:!?"""''«»()—\-]+)/;

export async function create({
    text_id,
    position,
    translation = null,
    note = null,
}) {
    await sqlite.exec({
        sql: "INSERT INTO sentences (text_id, position, translation, note) VALUES (?, ?, ?, ?)",
        parameters: [text_id, position, translation, note],
    });
    const rows = await sqlite.exec({
        sql: "SELECT last_insert_rowid() AS sentence_id",
    });
    return rows[0].sentence_id;
}

export async function get(sentence_id) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM sentences WHERE sentence_id = ?",
        parameters: [sentence_id],
    });
    return rows[0] ?? null;
}

export async function get_words(sentence_id) {
    const rows = await sqlite.exec({
        sql: `SELECT
                    w.word,
                    w.translation,
                    w.is_punctuation,
                    sw.is_capitalized,
                    sw.position,
                  FROM sentence_words sw
                  JOIN words w
                    ON sw.word_id = w.word_id
                  WHERE sw.sentence_id = ?`,
        parameters: [sentence_id],
    });
    return rows;
}

export async function list(text_id) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM sentences WHERE text_id = ? ORDER BY position",
        parameters: [text_id],
    });
    return rows;
}

export function tokenize(sentence) {
    // Split on whitespace and punctuation
    const tokens = sentence.split(BOUNDARY_PATTERN);
    
    // Filter out the whitespace
    return tokens.filter(token =>
        token.length > 0 && !/^\s+$/.test(token)
    );
}

export function is_punctuation(token) {
    return BOUNDARY_PATTERN.test(token);
}
