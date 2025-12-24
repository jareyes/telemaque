const MIGRATIONS = [
    // Add source texts table
    `CREATE TABLE IF NOT EXISTS texts (
         text_id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         author TEXT NOT NULL,
         description TEXT,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    // Add sentence table
    `CREATE TABLE IF NOT EXISTS sentences (
        sentence_id INTEGER PRIMARY KEY AUTOINCREMENT,
        text_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        translation TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    // Add words table
    `CREATE TABLE IF NOT EXISTS words (
        word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        original TEXT NOT NULL,
        translation TEXT NOT NULL,
        is_punctuation INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     -- Keep track of individual meanings
     UNIQUE(word, translation)
    )`,
    // Put words into sentences
    `CREATE TABLE IF NOT EXISTS sentence_words (
        sentence_word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sentence_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        is_capitalized INTEGER DEFAULT 0
    )`,
    // Allow for untranslated words
    `ALTER TABLE words DROP COLUMN original`,
    `ALTER TABLE words ADD COLUMN original TEXT`,    
];
const CREATE_MIGRATION_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
  migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_date DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

function already_applied(sqlite, migration_id) {
    const rows = sqlite.exec({
        sql: `SELECT COUNT(*) AS count FROM migrations
              WHERE migration_id = ?`,
        bind: [migration_id],
        returnValue: "resultRows",
        rowMode: "object",
    });
    const row = rows[0];
    return row.count > 0;
}

export default function migrate(sqlite) {
    // Create migration table
    sqlite.exec({sql: CREATE_MIGRATION_TABLE});
    for(
        let migration_id = 0;
        migration_id < MIGRATIONS.length;
        migration_id++
    ) {
        if(already_applied(sqlite, migration_id)) {
            console.debug({
                event: "Migrate.SKIP",
                migration_id,
            });
            continue;
        }
        const sql = MIGRATIONS[migration_id];
        sqlite.exec({sql});
        sqlite.exec({
            sql: `INSERT INTO migrations (migration_id)
                  VALUES (?)`,
            parameters: [migration_id],
        });
        console.log({
            event: "Migrate.APPLIED",
            migration_id,
        });
    }
}
