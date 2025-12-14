class Text {
    constructor(conn) {
        this.conn = conn;
    }

    create({
        author,
        title,
        description = null,
    }) {
        this.conn.exec({
            sql: `INSERT INTO texts (title, author, description)
                  VALUES (?, ?, ?)`,
            bind: [title, author, description],
        });
        const rows = this.conn.exec(
            "SELECT last_insert_rowid() as title_id",
            {returnValue: "resultRows"},
        );
        return rows[0][0];
    }
    
    get(text_id) {
        const rows = this.conn.exec({
            sql: "SELECT * FROM texts WHERE text_id = ?",
            bind: [text_id],
            returnValue: "resultRows",
            rowMode: "object",
        });
        
        return rows[0] || null;
    }
    
    list() {
        const rows = this.conn.exec(
            "SELECT * FROM texts ORDER BY created_at DESC",
            {
                returnValue: "resultRows",
                rowMode: "object",
            },
        );
        return rows;
    }
}

export default function createText(conn) {
    return new Text(conn);
}
