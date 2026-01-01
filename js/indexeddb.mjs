import migrations from "/js/migrations.mjs";

const NAME = "telemaque";
let DATABASE = null;

async function open(
    name=NAME,
    version=migrations.VERSION,
) {
    if(DATABASE !== null) {
        return DATABASE;
    }
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
        request.onupgradeneeded = migrations.migrate;
    });
}

export async function get(
    store,
    mode="readonly",
) {
    const database = await open();
    const transaction = database.transaction(
        [store],
        mode,
    );
    return transaction.objectStore(store);
}

export default {
    get,
};
