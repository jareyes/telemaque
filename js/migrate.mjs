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
        translation TEXT,
        is_punctuation INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     -- Keep track of individual meanings
     UNIQUE(original, translation)
    )`,
    // Put words into sentences
    `CREATE TABLE IF NOT EXISTS sentence_words (
        sentence_word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sentence_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        is_capitalized INTEGER DEFAULT 0
    )`,
    // Add original to sentence
    `ALTER TABLE sentences ADD COLUMN original`,
    // Spaced-repetition reviews
    `CREATE TABLE IF NOT EXISTS reviews (
        sentence_id INTEGER PRIMARY KEY,
        easiness_factor REAL DEFAULT 2.5,
        -- Time until next review
        interval_days REAL DEFAULT 1.0,
        -- Success reviews in a row
        repetitions INTEGER DEFAULT 0,
        last_reviewed_at DATETIME,
        next_review_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_attempts INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,
];
const CREATE_MIGRATION_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
  migration_id INTEGER PRIMARY KEY,
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
    return rows[0]?.count > 0;
}

export default function migrate(sqlite) {
    // Create migration table
    sqlite.exec({sql: CREATE_MIGRATION_TABLE});
    for(
        let i = 0;
        i < MIGRATIONS.length;
        i++
    ) {
        // Row IDs start at 1
        const migration_id = i + 1; 
        if(already_applied(sqlite, migration_id)) {
            console.debug({
                event: "Migrate.SKIP",
                migration_id,
            });
            continue;
        }
        const sql = MIGRATIONS[i];
        sqlite.exec({sql});
        sqlite.exec({
            sql: `INSERT INTO migrations (migration_id)
                  VALUES (?)`,
            parameters: [migration_id],
        });
        console.debug({
            event: "Migrate.APPLIED",
            migration_id,
        });
    }
}
