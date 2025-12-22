const {default: Sqlite3} = await import("/vendor/sqlite-wasm-3510100/jswasm/sqlite3.mjs");
const sqlite = await Sqlite3();

console.log({
    event: "DatabaseWorker.LOAD_SQLITE",
    version: sqlite.version
});

const DATABASE = new sqlite.oo1.OpfsDb("/telemaque.db");
console.log({
    event: "DatabaseWorker.CREATE",
});

// Add source texts table
 DATABASE.exec(
     `CREATE TABLE IF NOT EXISTS texts (
         text_id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         author TEXT NOT NULL,
         description TEXT,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
 );

DATABASE.exec(
    `CREATE TABLE IF NOT EXISTS sentences (
        sentence_id INTEGER PRIMARY KEY AUTOINCREMENT,
        text_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        translation TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
);

DATABASE.exec(
    `CREATE TABLE IF NOT EXISTS words (
        word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        translation TEXT NOT NULL,
        is_punctuation INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     -- Keep track of individual meanings
     UNIQUE(original, translation)
    )`
);


// Put words into sentences
DATABASE.exec(
    `CREATE TABLE IF NOT EXISTS sentence_words (
        sentence_word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sentence_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        is_capitalized INTEGER DEFAULT 0
    )`
);
*/
console.log({event: "Database.CREATE_TABLES"});

function act(action, options, db) {
    switch(action) {
    case "exec":
        console.log({
            event: "DatabaseWorker.ACT",
            action,
            db,
            options,
        });
        return db.exec(options);
    default:
        throw new Error(`Unknown action: ${action}`);
    }
}
function receive_message(event, db=DATABASE) {
    const {message_id, action, options} = event.data;
    try {
        const result = act(action, options, db);
        self.postMessage({message_id, result});
        console.debug({
            event: "DatabaseWorker.RECEIVE",
            message_id,
            action,
            options,
            result,
        });
    }
    catch(err) {
        console.error({
            event: "DatabaseWorker.RECEIVE",
            err,
        });
        self.postMessage({message_id, error: err.message});
    }
}

self.onmessage = receive_message;
self.postMessage({type: "ready"});


