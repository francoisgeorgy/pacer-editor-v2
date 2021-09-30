
export const MAX_FILE_SIZE = 200 * 1024;

// export const MAX_STATUS_MESSAGES = 40;

export const wait = ms => new Promise(r => setTimeout(r, ms));

export function isVal(v) {
    return v !== undefined && v !== null && v !== '' && v >= 0;
}

export function sortObject(obj) {
    let arr = [];
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'key': prop,
                'value': obj[prop]
            });
        }
    }
    arr.sort((a, b) => a.value.localeCompare(b.value));
    return arr;
}

export function object2Array(obj) {
    let arr = [];
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'key': prop,
                'value': obj[prop]
            });
        }
    }
    return arr;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
// Array.isArray() does not work with typed arrays; replaced with typeof === 'object'
//
export function flatDeep(arr, d = 1) {
    // console.log("flatDeep", d);
    return d > 0 ?
               arr.reduce(
                   (acc, val) => acc.concat(typeof val === 'object' ? flatDeep(val, d - 1) : val), []
               ) :
           arr.slice();
}

export function getTimestamp() {
    const now = new Date();
    return now.getUTCFullYear() + "-" +
            ("0" + (now.getUTCMonth() + 1)).slice(-2) + "-" +
            ("0" + now.getUTCDate()).slice(-2) + "-" +
            ("0" + now.getUTCHours()).slice(-2) + "" +
            ("0" + now.getUTCMinutes()).slice(-2) + "" +
            ("0" + now.getUTCSeconds()).slice(-2);
}