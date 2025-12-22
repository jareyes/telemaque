const BOUNDARY_PATTERN = /(\s+|[.,;:!?"""''«»()—\-]+)/;

class Sentence {
    constructor(conn) {
        this.conn = conn;
    }

    async create({
        text_id,
        position,
        translation = null,
        note = null,
    }) {
        await this.conn.exec({
            sql: "INSERT INTO sentences (text_id, position, translation, note) VALUES (?, ?, ?, ?)",
            bind: [text_id, position, translation, note],
        });
        const rows = await this.conn.exec({
            sql: "SELECT last_insert_rowid() AS sentence_id",
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0].sentence_id;
    }

    async get(sentence_id) {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM sentences WHERE sentence_id = ?",
            bind: [sentence_id],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows[0] ?? null;
    }

    async get_words(sentence_id) {
        const rows = await this.conn.exec({
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
            bind: [sentence_id],
            returnValue: "resultRows",
            rowMode: "object",
        });
        return rows;
    }

    async list(text_id) {
        const rows = await this.conn.exec({
            sql: "SELECT * FROM sentences WHERE text_id = ? ORDER BY position",
            bind: [text_id],
            returnValue: "resultRows",
            rowMode: "object"
        });
        return rows;
    }

    tokenize(sentence) {
        // Split on whitespace and punctuation
        const tokens = sentence.split(BOUNDARY_PATTERN);

        // Filter out the whitespace
        return tokens.filter(token =>
            token.length > 0 && !/^\s+$/.test(token)
        );
    }

    is_punctuation(token) {
        return BOUNDARY_PATTERN.test(token);
    }
}

export default function createSentence(conn) {
    return new Sentence(conn);
}
