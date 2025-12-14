// TODO: Get persistent storage to work. Right now it's only in-memory
// From the SQLite README:
// For OPFS (persistent storage) to work, send the special headers
// Cross-Origin-Opener-Policy: same-origin
// Cross-Origin-Embedder-Policy: require-corp
const SQLITE_URL = "/vendor/sqlite-wasm-3510100/jswasm/sqlite3.mjs"
// Global singleton state
let DATABASE = null;

async function getSqlite(url=SQLITE_URL) {
    const {default: Sqlite3} = await import(url);
    console.log("Sqlite3", Sqlite3);
    const sqlite = await Sqlite3();
    return sqlite;
}

async function get() {
    if(DATABASE !== null) {
        return DATABASE;
    }

    // Load WASM library
    const sqlite = await getSqlite();
    console.log({
        event: "Database.LOAD_SQLITE",
        version: sqlite.version
    });

    // Create (for now) in-memory database
    const db = new sqlite.oo1.DB();
    console.log({
        event: "Database.CREATE",
    });
    
    // Add source texts table
    db.exec(
        `CREATE TABLE IF NOT EXISTS texts (
            text_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
         )`
    );
    console.log({event: "Database.CREATE_TABLES"});

    DATABASE = db;
    return DATABASE;
}
     
export default {
    get,
}
