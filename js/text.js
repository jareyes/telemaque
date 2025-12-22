class Text {
    constructor(conn) {
        this.conn = conn;
    }

    async create({
        author,
        title,
        description = null,
    }) {
        await this.conn.exec({
            sql: `INSERT INTO texts (title, author, description)
                  VALUES (?, ?, ?)`,
            bind: [title, author, description],
        });
        const rows = await this.conn.exec({
            sql: "SELECT last_insert_rowid() AS title_id",
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0].title_id;
    }
    
    async get(text_id) {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM texts WHERE text_id = ?",
            bind: [text_id],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0] ?? null;
    }

    async sentence_count(text_id) {
        const rows = await this.conn.exec({
            sql: "SELECT COUNT(*) AS count FROM sentences WHERE text_id = ?",
            bind: [text_id],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0]?.count ?? null;
    }
    
    async list() {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM texts ORDER BY created_at DESC",
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows;
    }
}

export default function createText(conn) {
    return new Text(conn);
}
