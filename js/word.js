class Word {
    constructor(conn) {
        this.conn = conn;
    }

    async create({
        word,
        translation,
        is_punctuation
    }) {
        await this.conn.exec({
            sql: "INSERT INTO words (original, translation, is_punctuation) VALUES (?, ?, ?)",
            bind: [word, translation, is_punctuation],
        });

        const rows = await this.conn.exec({
            sql: "SELECT last_insert_rowid() AS word_id",
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0].word_id;
    }

    async find(word) {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM words WHERE original = ?",
            bind: [word],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows;
    }
    
    async get(word_id) {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM words WHERE word_id = ?",
            bind: [word_id],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0] ?? null;
    }

    async list(prefix) {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM words WHERE original like '?%'",
            bind: [prefix],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows;
    }
}

export default function create(conn) {
    return new Word(conn);
}
