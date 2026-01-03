import store from "/js/store.mjs";

const STORE = store.LANGUAGE_STORE;

export /* async */ function get(language_code) {
    return store.get(STORE, language_code);
}

export async function list() {
    const languages = await store.get_all(STORE);
    // Sort by name
    languages.sort((x, y) =>
        x.language_code.localeCompare(y.language_code),
    );
    return languages;
}

export default {
    get,
    list,
};
