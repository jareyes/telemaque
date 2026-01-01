const NAME = "telemaque";
const VERSION = 1;

const DATABASE = await open();

function create_texts(database) {
    if(database.objectStoreNames.contains("texts")) {
        return;
    }
    const store = database.createObjectStore(
        "texts",
        {keyPath: "text_id"},
    );
    store.createIndex(
        "language",
        "language",
        {unique: false},
    );
    console.log({
        event: "IndexedDb.CREATE",
        store: "texts",
    });
}

async function open(name=NAME, version=VERSION) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const database = request.result;
            resolve(database);
            console.log({
                event: "IndexedDb.OPEN",
            });
        };
        // Handle migrations
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            create_texts(database);            
        };
    });
}

export async function get(store, mode="readonly", database=DATABASE) {
    const transaction = database.transaction(
        [store],
        mode,
    );
    return transaction.objectStore(store);
}

export default {
    get,
};
