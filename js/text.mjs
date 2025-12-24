import * as sqlite from "/js/sqlite.mjs"

export async function create({
    author,
    title,
    description = null,
}) {
    await sqlite.exec({
        sql: `INSERT INTO texts
                (title, author, description)
              VALUES (?, ?, ?)`,
        parameters: [title, author, description],
    });
    const rows = await sqlite.exec({
        sql: "SELECT last_insert_rowid() AS text_id",
    });
    return rows[0].text_id;
}

export async function get(text_id) {
    const rows = await sqlite.exec({
        sql: "SELECT * FROM texts WHERE text_id = ?",
        parameters: [text_id],
    });
    return rows[0] ?? null;
}

export async function list() {
    const rows = await sqlite.exec({
        sql: `SELECT * FROM texts
              ORDER BY created_at DESC`,
    });
    return rows;
}

export async function sentence_count(text_id) {
    const rows = await sqlite.exec({
        sql: `SELECT COUNT(*) AS count FROM sentences
              WHERE text_id = ?`,
        parameters: [text_id],
    });
    return rows[0]?.count ?? null;
}
