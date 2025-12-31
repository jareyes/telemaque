import sqlite from "/js/sqlite-client.mjs";

export async function create({
    text_id,
    original,
    position,
    translation = null,
    note = null,
}) {
    await sqlite.exec({
        sql: "INSERT INTO sentences (text_id, position, original, translation, note) VALUES (?, ?, ?, ?, ?)",
        parameters: [text_id, position, original, translation, note],
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

export async function get_last(text_id) {
    const rows = await sqlite.exec({
        sql: `SELECT MAX(sentence_id) AS sentence_id
              FROM sentences
              WHERE text_id = ?`,
        parameters: [text_id],
    });
    if(rows.length < 1) {
        return null;
    }
    return rows[0].sentence_id;
}

export async function get_words(sentence_id) {
    const rows = await sqlite.exec({
        sql: `SELECT
                    w.original,
                    w.translation,
                    w.is_punctuation,
                    sw.is_capitalized,
                    sw.position
                  FROM sentence_words sw
                  JOIN words w
                    ON sw.word_id = w.word_id
                  WHERE sw.sentence_id = ?
                  ORDER BY sw.position ASC`,
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

export async function place({
    sentence_id,
    word_id,
    position,
    is_capitalized,
}) {
    await sqlite.exec({
        sql: `INSERT INTO sentence_words (
                sentence_id,
                word_id,
                position,
                is_capitalized
              )
              VALUES (?, ?, ?, ?)`,
        parameters: [
            sentence_id,
            word_id,
            position,
            is_capitalized,
        ],
    });
}

export default {
    create,
    get,
    get_last,
    get_words,
    list,
    place,
};
