const WORKER_URL = "/js/sqlite-worker.mjs";

// Global module state
const WORKER = create_worker(WORKER_URL);
const MESSAGES = new Map();
let MESSAGE_ID = 0;

// Create a continuation that we await until the worker
// has sent us a message that it is ready
let READY = false;
const READY_PROMISE = new Promise(resolve => {
    self.workerReadyResolve = resolve;
});

function receive_message(
    event,
    pending_messages=MESSAGES,
) {
    const {message_id, result, error} = event.data;
    try {
        const pending = pending_messages.get(message_id);
        console.debug({
            event: "Database.RECEIVE",
            message_id,
            result,
            error,
            pending,
        });

        if(pending === undefined) {
            console.log({
                event: "Database.NOT_FOUND",
                message_id,
            });
            return;
        }
        if(error !== undefined) {
            return pending.reject(new Error(error));
        }
        pending.resolve(result);
    }
    finally {
        pending_messages.delete(message_id);
    }
}

function create_worker(url) {
    const worker = new Worker(url, {type: "module"});
    worker.onmessage = (event) => {
        if(event.data.type == "ready") {
            READY = true;
            return self.workerReadyResolve();
        }
        receive_message(event);
    };
    worker.onmessageerror = console.error;
    return worker;
}

async function send_message(
    action,
    data,
    worker=WORKER,
    pending_messages=MESSAGES,
) {
    // Wait for the Worker to signal that it is ready
    if(!READY) {
        await READY_PROMISE;
    }

    const message_id = MESSAGE_ID++;
    console.debug({
        event: "Database.SEND_MESSAGE",
        message_id,
        action,
        data,
        worker,
    });
    return new Promise((resolve, reject) => {
        pending_messages.set(
            message_id,
            {resolve, reject},
        );
        worker.postMessage({message_id, action, ...data});
    });
}

export function exec(options) {
    return send_message("exec", {options});
}


