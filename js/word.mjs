import * as sqlite from "/js/sqlite.js"

export async function create({
    word,
    translation,
    is_punctuation
}) {
    await sqlite.exec({
        sql: "INSERT INTO words (original, translation, is_punctuation) VALUES (?, ?, ?)",
        parameters: [word, translation, is_punctuation],
    });

    const rows = await sqlite.exec({
        sql: "SELECT last_insert_rowid() AS word_id",
        returnValue: "resultRows",
        rowMode: "object",
    });
    return rows[0].word_id;
}

export async function find(word) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM words WHERE original = ?",
        parameters: [word],
    });
    return rows;
}

export async function get(word_id) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM words WHERE word_id = ?",
        parameters: [word_id],
    });
    return rows[0] ?? null;
}

export async function list(prefix) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM words WHERE original like '?%'",
        parameters: [prefix],
    });
    return rows;
}
