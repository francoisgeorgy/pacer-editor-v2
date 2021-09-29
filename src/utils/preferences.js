import store from "storejs";

export const LOCAL_STORAGE_KEY = "studiocode.pacereditor.preferences";

export const DEFAULT_PREFERENCES = {
    input_id: null,      // web midi port ID
    output_id: null,      // web midi port ID
    colors: false
}

export function loadPreferences() {
    const s = store.get(LOCAL_STORAGE_KEY);
    return Object.assign({}, DEFAULT_PREFERENCES, s ? JSON.parse(s) : {});
}

export function savePreferences(options = {}) {
    store(LOCAL_STORAGE_KEY, JSON.stringify(Object.assign({}, loadPreferences(), options)));
}
