import {NEKTAR_TECHNOLOGY_INC} from "midi-manufacturers";
import {h, hs} from "../utils/hexstring";
import {
    COMMAND_GET,
    COMMAND_SET,
    CONTROL_ALL,
    CONTROL_EXPRESSION_PEDAL_1,
    CONTROL_EXPRESSION_PEDAL_2,
    CONTROL_FOOTSWITCH_4,
    CONTROL_MIDI,
    CONTROL_MODE_ELEMENT,
    CONTROL_NAME,
    CONTROL_STOMPSWITCH_1,
    CONTROL_STOMPSWITCH_6,
    CONTROL_STOMPSWITCH_A,
    CONTROLS, EXPPEDALS, FOOTSWITCHES, STOMPSWITCHES_BOTTOM, STOMPSWITCHES_TOP,
    SYSEX_HEADER, SYSEX_SIGNATURE, TARGET_BACKUP, TARGET_GLOBAL,
    TARGET_PRESET,
    TARGETS
} from "./constants";
import {stores} from "../stores";
import React from "react";

export const SINGLE_PRESET_EXPECTED_BYTES = 5546;
export const FULL_DUMP_EXPECTED_BYTES = 139544;

export const SYSEX_START = 0xF0;
export const SYSEX_END = 0xF7;

// data structure keys:
export const CONTROLS_DATA = "controls";
export const STEPS_DATA = "steps";

// offsets from start of sysex data, right after SYSEX_START
const CMD = 4;
const TGT = 5;
const IDX = 6;
const OBJ = 7;
const ELM = 8;

/**
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/34749873#34749873
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/34749873#34749873
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {

    if (!sources.length) return target;

    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export function checksum(bytes) {
    if (bytes === null || bytes === undefined || bytes.length === 0) return 128;
    let sum = Uint8Array.from(bytes).reduce((previousValue, currentValue) => previousValue + currentValue);
    return (128 - (sum % 128)) % 128;
}

/**
 *
 * @param data Uint8Array
 */
function isSysexData(data) {
    if (data[0] !== SYSEX_START) return false;
    if (data[data.byteLength - 1] !== SYSEX_END) return false;
    return true;
}

// sysex contains START and END markers
function getDataTarget(sysex) {
    // 00 01 77 7f 01 01 13 01 01 05 47 2d 4d 53 54 7c
    return {
        isPresetName: sysex[TGT+1] === TARGET_PRESET && sysex[OBJ+1] === 1,
        isPreset: sysex[TGT+1] === TARGET_PRESET,
        isGlobal: sysex[TGT+1] === TARGET_GLOBAL,
        presetNum: sysex[IDX+1]
    }
}

function getControlStep(data) {

    // 01 01 0F 00      midi channel
    // 02 01 47 00      message type
    // 03 01 44 00      data 1
    // 04 01 55 00      data 2
    // 05 01 66 00      data 3
    // 06 01 01         active

    // the second byte is the length of the data that follows

    //FIXME: use length

    return {
        index: (data[0] - 1) / 6 + 1,
        config: {
            channel: data[2],
            msg_type: data[6],
            data: [data[10], data[14], data[18]],
            active: data[22]
        }
    };
}


function getControlMode(data) {
    return {
        control_mode: data[2]
    };
}


function getControlLED(data) {

    // 0x40	<data>-MIDICtrl	Step 1: LED MIDI Ctrl
    // 0x41	<data>-Color	Step 1: LED Active Color
    // 0x42	<data>-Color	Step 1: LED Inactive Color
    // 0x43	<data>-LEDNum	Step 1: LED num

    let cfg = {steps:{}};

    let data_len;
    let bytes;
    let step;

    let i = 0;
    while (i<data.length) {
        let d = data[i];
        if (i===0) {
            step = "" + ((d - 0x40) / 4 + 1);
        }
        if (!(step in cfg.steps)) cfg.steps[step] = {};
        switch (d) {
            case 0x40:
            case 0x44:
            case 0x48:
            case 0x4C:
            case 0x50:
            case 0x54:
                i++;
                data_len = data[i];
                i++;
                if (data_len === 1) {
                    bytes = data[i];
                } else {
                    bytes = Array.from(data.slice(i, i + data_len));
                }
                i += data_len;
                cfg.steps[step]["led_midi_ctrl"] = bytes;
                break;
            case 0x41:
            case 0x45:
            case 0x49:
            case 0x4D:
            case 0x51:
            case 0x55:
                i++;
                data_len = data[i];
                i++;
                if (data_len === 1) {
                    bytes = data[i];
                } else {
                    bytes = Array.from(data.slice(i, i + data_len));
                }
                i += data_len;
                cfg.steps[step]["led_active_color"] = bytes;
                break;
            case 0x42:
            case 0x46:
            case 0x4A:
            case 0x4E:
            case 0x52:
            case 0x56:
                i++;
                data_len = data[i];
                i++;
                if (data_len === 1) {
                    bytes = data[i];
                } else {
                    bytes = Array.from(data.slice(i, i + data_len));
                }
                i += data_len;
                cfg.steps[step]["led_inactive_color"] = bytes;
                break;
            case 0x43:
            case 0x47:
            case 0x4B:
            case 0x4F:
            case 0x53:
            case 0x57:
                i++;
                data_len = data[i];
                i++;
                if (data_len === 1) {
                    bytes = data[i];
                } else {
                    bytes = Array.from(data.slice(i, i + data_len));
                }
                i += data_len;
                cfg.steps[step]["led_num"] = bytes;
                break;
            case 0x7F:
                i = data.length;
                break;
            default:
                // console.log(`getControlLED: ignore byte ${h(d)}`);
                i++;
                break;
        }
    }

    return cfg;
}

function getMidiSetting(data) {
    return {
        index: (data[0] - 1) / 6 + 1,       // e.g.: 7 --> 1, ..., 0x2B 43 --> 8
        config: {
            channel: data[2],
            msg_type: data[6],
            data: [data[10], data[14], data[18]]
        }
    };
}

function getPresetName(data) {
    const len = data[1];
    return String.fromCharCode.apply(null, data.slice(2, 2 + len));
}

function getMessageTarget(data) {
    const i = data[0] === SYSEX_START ? IDX + 1 : IDX;
    console.log(i, data?.[i] ?? '', hs(data));
    return data?.[i] ?? '';
}

/**
 * Parse a single sysex message
 * @param data
 * @returns {*}
 */
function parseSysexMessage(data) {

    //TODO: verify checksum

    // console.log("parseSysexMessage", data, JSON.stringify(data));

    const message = {};

    let cmd = data[CMD];
    let tgt = data[TGT];
    let idx = data[IDX];
    let obj = data[OBJ];

    // console.log("parseSysexMessage cmd, tgt, idx, obj", cmd, tgt, idx, obj, hs(data));

    switch (cmd) {
        case COMMAND_SET:
            break;
        case COMMAND_GET:
            break;
        default:
            console.warn(`parseSysexMessage: invalid command (${h(cmd)})`);
            return null;
    }

    if (!(tgt in TARGETS)) {
        console.warn("parseSysexMessage: invalid target", h(tgt), tgt, TARGETS);
        return null;
    }

    message[tgt] = {};

    if (idx >= 0x19 && idx <= 0x7E) {
        // console.warn("parseSysexMessage: invalid/ignored idx", idx);
    }

    message[tgt][idx] = {   //NOTE: idx is transformed in string here (Property names must be strings, https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
        // bytes: data      //TODO: consolidate data per preset
    };

    if (data.length === 7) return message;

    if (!(obj in CONTROLS)) {
        // console.warn("parseSysexMessage: invalid/ignored object", h(obj));
        return null;
    }

    let obj_type;
    if (obj === CONTROL_NAME) {
        obj_type = "name";
    } else if ((obj >= CONTROL_STOMPSWITCH_1 && obj <= CONTROL_STOMPSWITCH_6) ||
        (obj >= CONTROL_STOMPSWITCH_A && obj <= CONTROL_FOOTSWITCH_4) ||
        (obj >= CONTROL_EXPRESSION_PEDAL_1 && obj <= CONTROL_EXPRESSION_PEDAL_2)) {
        obj_type = "control";
    } else if (obj === CONTROL_MIDI) {
        obj_type = "midi";
    } else if (obj === CONTROL_ALL) {
        obj_type = "all";
    } else {
        console.warn('parseSysexMessage: invalid obj', obj);
        return null;
    }

    // if (data.length === 8) return message;

    // console.log(`target=${TARGET[tgt]} (${h(tgt)}), idx=${h(idx)}, object=${OBJECT[obj]} (${h(obj)}), type=${obj_type}`);
    // console.log(`${TARGETS[tgt]} ${h(idx)} : ${CONTROLS[obj]} ${obj_type}`);

    if (obj_type === "name") {

        // NAME
        message[tgt][idx]["name"] = getPresetName(data.slice(ELM));

    }

    if (obj_type === "control") {

        message[tgt][idx][CONTROLS_DATA] = {
            [obj]: {
                steps: {}
            }
        };

        if (data.length > 9) {

            // which element?
            let e = data[ELM];

            if (e >= 0x01 && e <= 0x24) {

                // STEPS
                if (data.length > ELM + 22) {
                    let s = getControlStep(data.slice(ELM, ELM + 23));
                    message[tgt][idx][CONTROLS_DATA][obj]["steps"][s.index] = s.config;
                } else {
                    console.warn(`parseSysexMessage: data does not contains steps. data.length=${data.length}`, hs(data));
                }

            } else if (e === CONTROL_MODE_ELEMENT) {

                // CONTROL MODE
                // console.log('parseSysexMessage: CONTROL MODE', idx, obj, ELM, data.slice(ELM, data.length - 1), data);

                let mode_cfg = getControlMode(data.slice(ELM, data.length - 1));
                message[tgt][idx][CONTROLS_DATA][obj] = mergeDeep(message[tgt][idx][CONTROLS_DATA][obj], mode_cfg);

            } else if (e >= 0x40 && e <= 0x57) {

                // LED
                // console.log('parseSysexMessage: LED');

                let led_cfg = getControlLED(data.slice(ELM, data.length - 1));
                message[tgt][idx][CONTROLS_DATA][obj] = mergeDeep(message[tgt][idx][CONTROLS_DATA][obj], led_cfg);

            } else if (e === 0x7F) {

                // ALL
                // console.log('parseSysexMessage: ALL');

            } else {
                console.warn(`parseSysexMessage: unknown element: ${h(e)}`);
                return null;
            }
        } else {

            message[tgt][idx][CONTROLS_DATA] = {
                [obj]: {}
            };

        }

    }

    if (obj_type === "midi") {

        message[tgt][idx]["midi"] = {};

        // which element?
        let e = data[ELM];

        if (e >= 0x01 && e <= 0x60) {

            // SETTINGS
            if (data.length > ELM+19) {
                let s = getMidiSetting(data.slice(ELM, ELM + 20));
                message[tgt][idx]["midi"][s.index] = s.config;
            } else {
                console.warn(`parseSysexMessage: data does not contains steps. data.length=${data.length}`, hs(data));
            }

        } else {
            console.warn(`parseSysexMessage: unknown element: ${h(e)}`);
            return null;
        }

    }


    if (obj_type === "all") {
        message[tgt][idx]["all"] = {};
    }

    return message;

} // parseSysex()


/**
 * Parse a sysex dump. A dump can contains multiple sysex messages.
 * Return a array of presets.
 * @param data ArrayBuffer
 */
function parseSysexDump(data) {

    if (data === null) return null;

    let presets = {};   // Collection of presets. The key is the preset's index. The value is the preset.

    let i = 0;
    let cont = true;
    while (cont) {

        i = data.indexOf(SYSEX_START, i);
        if (i < 0) break;

        i++;
        let k = data.indexOf(SYSEX_END, i);

        let manufacturer_id = (Array.from(data.slice(i, i+3)).map(n => h(n))).join(" ");    // Array.from() is necessary to get a non-typed array
        if (manufacturer_id !== NEKTAR_TECHNOLOGY_INC) {
            console.log("parseSysexDump: file does not contain a Nektar Pacer patch", i, k, manufacturer_id, "-", hs(data));
            return null;
        }

        if (data[i+3] !== 0x7F) {
            console.warn(`parseSysexDump: invalid byte after manufacturer id: ${data[i+1 +3]}`);
            return null;
        }

        let config = parseSysexMessage(data.slice(i, k));  // data.slice(i, k) are the data between SYSEX_START and SYSEX_END

        if (config) {
            mergeDeep(presets, config);
        }

    } // while

    return presets;
}


/**
 * Split a dump into individual sysex messages
 * @param data
 * @param stripManufacturer
 * returns a array of sysex messages. The messages do not contains the sysex "start of sysex" 0xF0 and "end of sysex" 0xF7 bytes.
 */
function splitDump(data, stripManufacturer) {

    if (data === null) return [];

    let messages = [];

    let i = 0;
    let cont = true;
    while (cont) {

        i = data.indexOf(SYSEX_START, i);
        if (i < 0) break;

        i++;
        let k = data.indexOf(SYSEX_END, i);

        let manufacturer_id = (Array.from(data.slice(i, i+3)).map(n => h(n))).join(" ");    // Array.from() is necessary to get a non-typed array
        if (manufacturer_id !== NEKTAR_TECHNOLOGY_INC) {
            console.log("parseSysexDump: dump does not contain a Nektar Pacer patch", i, k, manufacturer_id, "-", hs(data));
            return null;
        }

        if (data[i+3] !== 0x7F) {
            console.warn(`parseSysexDump: invalid byte after manufacturer id: ${data[i+1 +3]}`);
            return null;
        }

        messages.push(data.slice(i+3, k));  // data.slice(i, k) are the data between MANUFACTURER and SYSEX_END

    } // while

    return messages;
}


/**
 * Split a sysex dump into individual presets
 *
 * input: binay data
 * output: collection (key-value obj) of binary data
 */
/*
function splitDump(data) {

    if (data === null) return {};

    let presets = [];   // Collection of presets. The key is the preset's index. The value is the preset.
    // let global = {};    // global conf

    let i = 0;
    let cont = true;
    while (cont) {

        i = data.indexOf(SYSEX_START, i);
        if (i < 0) break;

        i++;

        let k = data.indexOf(SYSEX_END, i);

        let manufacturer_id = (Array.from(data.slice(i, i+3)).map(n => h(n))).join(" ");    // Array.from() is necessary to get a non-typed array
        if (manufacturer_id !== NEKTAR_TECHNOLOGY_INC) {
            console.log("parseSysexDump: file does not contain a Nektar Pacer patch", i, k, manufacturer_id, "-", hs(data));
            return {};
        }

        if (data[i+3] !== 0x7F) {
            console.warn(`parseSysexDump: invalid byte after manufacturer id: ${data[i+1 +3]}`);
            return {};
        }

        let d = data.slice(i, k);

        // let config = parseSysexMessage(data.slice(i, k));  // data.slice(i, k) are the data between SYSEX_START and SYSEX_END

        // if (config) {
        //     mergeDeep(presets, config);
        // }

    } // while

    // console.log("parseSysexDump", JSON.stringify(presets));

    return presets;
}
*/


/**
 *
 */
export function requestAllPresets() {
    // let msg = [
    //     COMMAND_GET,
    //     TARGET_PRESET,
    //     CONTROL_ALL
    // ];
    let msg = [
        COMMAND_GET,
        TARGET_BACKUP
    ];
    let cs = checksum(msg);
    msg.push(cs);
    return SYSEX_HEADER.concat(msg);
}

/**
 * return the sysex message to send to the Pacer to request some data
 */
export function requestPreset(presetIndex) {
    let msg = [
        COMMAND_GET,
        TARGET_PRESET,
        parseInt(presetIndex, 10),
        CONTROL_ALL
    ];
    let cs = checksum(msg);
    msg.push(cs);
    return SYSEX_HEADER.concat(msg);
}

/**
 * return the sysex message to send to the Pacer to request some data
 * ONLY FOR DEBUG
 */
export function requestPresetObj(presetIndex, controlId) {

    // To get the LED data, we need to request the complete preset config instead of just the specific control's config.
    // return requestPreset(presetIndex);
    let msg = [
        COMMAND_GET,
        TARGET_PRESET,
        parseInt(presetIndex, 10),
        parseInt(controlId, 10)
    ];
    let cs = checksum(msg);
    msg.push(cs);
    return SYSEX_HEADER.concat(msg);
}


function buildSysexMessage(data, complete=false) {

    let msg = [];
    if (complete) {
        msg.push(SYSEX_START, ...SYSEX_SIGNATURE);
    }

    msg.push(
        ...SYSEX_HEADER,
        ...data,
        checksum(data)
    );

    if (complete) {
        msg.push(SYSEX_END);
    }

    return msg;
}


/**
 * Return an array of sysex messages to update a control's steps.
 * @param presetIndex
 * @param controlId
 * @param steps
 * @returns {*}
 */
function getControlStepSysexMessages(presetIndex, controlId, steps, forceUpdate = false, complete = false) {

    let msgs = [];

    for (let i of Object.keys(steps)) {

        let step = steps[i];

        if (!forceUpdate && !step.changed) continue;

        let msg = [];
        msg.push(
            // ...SYSEX_HEADER,
            COMMAND_SET,
            TARGET_PRESET,
            parseInt(presetIndex, 10),
            parseInt(controlId, 10)
        );

        msg.push((i-1)*6 + 1, 1, step.channel ?? 0, 0x00);
        msg.push((i-1)*6 + 2, 1, step.msg_type ?? 0, 0x00);
        msg.push((i-1)*6 + 3, 1, step.data[0] ?? 0, 0x00);
        msg.push((i-1)*6 + 4, 1, step.data[1] ?? 0, 0x00);
        msg.push((i-1)*6 + 5, 1, step.data[2] ?? 0, 0x00);
        msg.push((i-1)*6 + 6, 1, step.active ?? 0);

        msgs.push(buildSysexMessage(msg, complete));
    }
    return msgs;
}

function getControlStepLedSysexMessages(presetIndex, controlId, steps, forceUpdate = false, complete = false) {

    let msgs = [];

    for (let i of Object.keys(steps)) {

        let step = steps[i];

        if (!forceUpdate && !step.led_changed) continue;

        let msg = [];

        msg.push(
            // ...SYSEX_HEADER,
            COMMAND_SET,
            TARGET_PRESET,
            parseInt(presetIndex, 10),
            parseInt(controlId, 10)
        );

        msg.push((i-1)*4 + 0x40, 1, step.led_midi_ctrl ?? 0, 0x00);
        msg.push((i-1)*4 + 0x41, 1, step.led_active_color ?? 0, 0x00);
        msg.push((i-1)*4 + 0x42, 1, step.led_inactive_color ?? 0, 0x00);
        msg.push((i-1)*4 + 0x43, 1, step.led_num ?? 0);

        msgs.push(buildSysexMessage(msg, complete));
    }
    return msgs;
}

/**
 *
 * @param presetIndex
 * @param controlId
 * @param mode
 * @returns {number[]}
 */
function getControlModeSysexMessages(presetIndex, controlId, mode, forceUpdate = false, complete = false) {

    if (!forceUpdate && !mode.control_mode_changed) return [];   // order important because "control_mode_change" could be undefined

    let msg = [];

    msg.push(
        // ...SYSEX_HEADER,
        COMMAND_SET,
        TARGET_PRESET,
        parseInt(presetIndex, 10),
        parseInt(controlId, 10),
        CONTROL_MODE_ELEMENT,
        0x01,   // 1 byte of data
        mode["control_mode"] ?? 0
    );

    return [buildSysexMessage(msg, complete)];
}

/**
 * Wihtout Control Mode config
 * Without LED config
 *
 * @param presetIndex
 * @param controlId
 * @param data
 * @param forceUpdate
 * @returns {*}
 */
function getControlUpdateSysexMessages(presetIndex, controlId, data, forceUpdate = false, complete = false) {

    // if (!data[TARGET_PRESET][presetIndex]) return [];
    // if (!data[TARGET_PRESET][presetIndex][CONTROLS_DATA]) return [];
    // if (!data[TARGET_PRESET][presetIndex][CONTROLS_DATA][controlId]) return [];
    if (!data?.[TARGET_PRESET]?.[presetIndex]?.[CONTROLS_DATA]?.[controlId]) return [];

    const hasLEDs = !(FOOTSWITCHES.includes(controlId) || EXPPEDALS.includes(controlId));

    const d = data[TARGET_PRESET][presetIndex][CONTROLS_DATA][controlId];

    if (hasLEDs) {
        return [
            ...getControlModeSysexMessages(presetIndex, controlId, d, forceUpdate, complete),
            ...getControlStepSysexMessages(presetIndex, controlId, d["steps"], forceUpdate, complete),
            ...getControlStepLedSysexMessages(presetIndex, controlId, d["steps"], forceUpdate, complete)
        ];
    } else {
        return [
            ...getControlModeSysexMessages(presetIndex, controlId, d, forceUpdate, complete),
            ...getControlStepSysexMessages(presetIndex, controlId, d["steps"], forceUpdate, complete)
        ];
    }
}

function getMidiSettingsSysexMessages(presetIndex, settings, forceUpdate = false, complete = false) {

    if (!settings) return [];

    let msgs = [];

    const data_separator = 0x00;

    for (let i of Object.keys(settings)) {

        let setting = settings[i];
        if (!setting.changed && !forceUpdate) continue;

        let msg = [];
        msg.push(
            // ...SYSEX_HEADER,
            COMMAND_SET,
            TARGET_PRESET,
            parseInt(presetIndex, 10),
            CONTROL_MIDI
        );

        msg.push((i-1)*6 + 1, 1, setting.channel ?? 0, data_separator);
        msg.push((i-1)*6 + 2, 1, setting.msg_type ?? 0, data_separator);
        msg.push((i-1)*6 + 3, 1, setting.data[0] ?? 0, data_separator);
        msg.push((i-1)*6 + 4, 1, setting.data[1] ?? 0, data_separator);
        msg.push((i-1)*6 + 5, 1, setting.data[2] ?? 0);
        // msg.push((i-1)*6 + 6, 1, setting.active ?? 0);

        msgs.push(buildSysexMessage(msg, complete));
    }
    return msgs;
}


function getPresetNameSysexMessages(presetIndex, data, complete=false) {

    let msgData = [
        COMMAND_SET,
        TARGET_PRESET,
        parseInt(presetIndex, 10),
        CONTROL_NAME,
        0x01            // when setting the name this byte can be anything
    ];

    const s = data[TARGET_PRESET][presetIndex]["name"];
    if (s) {
        msgData.push(s.length);
        for (let i=0; i < s.length; i++) {
            msgData.push(s.charCodeAt(i));
        }
    } else {
        msgData.push(0);
    }

    return [buildSysexMessage(msgData, complete)];
}


function getMidiSettingUpdateSysexMessages(presetIndex, data, complete= false) {
    return getMidiSettingsSysexMessages(presetIndex, data[TARGET_PRESET][presetIndex]["midi"], true, complete);
}

export function getFullNonGlobalConfigSysex(data, filter = true, fullSysex = false) {
    if (!data) return []
    const msgs = [];
    Object.keys(data[TARGET_PRESET])
        .filter(presetIndex => !filter || (stores.state.overviewSelection.length < 1) || stores.state.overviewSelection.includes(presetIndex))
        .forEach(presetIndex => {
            msgs.push(...getPresetNameSysexMessages(presetIndex, data, fullSysex));
            STOMPSWITCHES_BOTTOM.forEach(controlId => msgs.push(...getControlUpdateSysexMessages(presetIndex, controlId, data, true, fullSysex)));
            STOMPSWITCHES_TOP.forEach(controlId => msgs.push(...getControlUpdateSysexMessages(presetIndex, controlId, data, true, fullSysex)));
            FOOTSWITCHES.forEach(controlId => msgs.push(...getControlUpdateSysexMessages(presetIndex, controlId, data, true, fullSysex)));
            EXPPEDALS.forEach(controlId => msgs.push(...getControlUpdateSysexMessages(presetIndex, controlId, data, true, fullSysex)));
            msgs.push(...getMidiSettingUpdateSysexMessages(presetIndex, data, fullSysex));
        });
    // console.log("getFullNonGlobalConfigSysex", msgs);
    return msgs;
}

export {
    getDataTarget,
    isSysexData,
    getMessageTarget,
    parseSysexDump,
    getControlUpdateSysexMessages,
    getMidiSettingUpdateSysexMessages,
    getPresetNameSysexMessages,
    splitDump
};

