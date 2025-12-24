import migrate from "/js/migrate.mjs";
const {
    default: Sqlite3
} = await import("/vendor/sqlite-wasm-3510100/jswasm/sqlite3.mjs");
const sqlite = await Sqlite3();

console.log({
    event: "DatabaseWorker.LOAD_SQLITE",
    version: sqlite.version
});

const DATABASE = new sqlite.oo1.OpfsDb("/telemaque.db");
console.log({
    event: "DatabaseWorker.CREATE",
});
migrate(DATABASE);

function act(action, options, db) {
    switch(action) {
    case "exec":
        console.log({
            event: "DatabaseWorker.ACT",
            action,
            db,
            options,
        });
        const {sql, parameters} = options;
        return db.exec({
            sql,
            bind: parameters,
            returnValue: "resultRows",
            rowMode: "object",
        });
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


