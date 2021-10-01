// https://stackoverflow.com/questions/9168737/read-a-text-file-using-node-js

const SYSEX_START = 0xF0;
const SYSEX_END = 0xF7;


const padZero = (str, len, char) => {
    let s = '';
    let c = char || '0';
    let n = (len || 2) - str.length;
    while (s.length < n) s += c;
    return s + str;
}

function h(v) {
    // return (v === null || v === undefined) ? "" : padZero(v.toString(16).toUpperCase(), 2);
    return (v === null || v === undefined) ? "" : padZero(v.toString(16), 2);
}

function hs(data) {
    return (data === null || data === undefined) ? "" : (Array.from(data).map(n => h(n))).join(" ");
}


function parseSysexDump(data) {

    if (data === null) return null;

    let presets = {};   // Collection of presets. The key is the preset's index. The value is the preset.
    // let global = {};    // global conf

    let i = 0;
    let cont = true;
    while (cont) {

        i = data.indexOf(SYSEX_START, i);
        if (i < 0) break;

        i++;
        let k = data.indexOf(SYSEX_END, i);

        let manufacturer_id = (Array.from(data.slice(i, i+3)).map(n => h(n))).join(" ");    // Array.from() is necessary to get a non-typed array
        // if (manufacturer_id !== NEKTAR_TECHNOLOGY_INC) {
        //     console.log("parseSysexDump: file does not contain a Nektar Pacer patch", i, k, manufacturer_id, "-", hs(data));
        //     return null;
        // }
        // console.log("manufacturer = ", manufacturer_id);

        if (data[i+3] !== 0x7F) {
            console.warn(`invalid byte after manufacturer id: ${data[i+1 +3]}`);
            // return null;
        }

        // let config = parseSysexMessage(data.slice(i, k));  // data.slice(i, k) are the data between SYSEX_START and SYSEX_END
        // console.log("parse message", i, k);

        // console.log("parseSysexDump", config);

        parseSysexMessage(data.slice(i, k));

        // const p = parseMessage(data.slice(i, k));
        // console.log("parsed", p);

        // if (config) {
        //     mergeDeep(presets, config);

            // const tgt = parseInt(Object.keys(config)[0], 10);
            // const idx = parseInt(Object.keys(config[tgt])[0], 10);
            // console.log("parseSysexDump", tgt, idx);
            // if (tgt === TARGET_PRESET) {
            //     this.bytesPresets[`${idx}`].push(data.slice(i, k));
            // } else if (tgt === TARGET_GLOBAL) {
            //     this.bytesGlobal.push(data.slice(i, k));
            // }
            // console.log("bytesPresets", this.bytesPresets);

        // }

        // break;

    } // while

    // console.log("parseSysexDump", JSON.stringify(presets));

    return presets;
}


// offsets from start of sysex data, right after SYSEX_START
const CMD = 4;
const TGT = 5;
const IDX = 6;
const OBJ = 7;
const ELM = 8;


const COMMAND_SET = 0x01;
const COMMAND_GET = 0x02;

const TARGET_PRESET = 0x01;
const TARGET_GLOBAL = 0x05;
const TARGET_BACKUP = 0x7F;

const TARGETS = {
    [TARGET_PRESET]: "preset",
    [TARGET_GLOBAL]: "global",
    [TARGET_BACKUP]: "full backup"
};

const CONTROL_NAME = 0x01;
const CONTROL_STOMPSWITCH_1 = 0x0D;
const CONTROL_STOMPSWITCH_2 = 0x0E;
const CONTROL_STOMPSWITCH_3 = 0x0F;
const CONTROL_STOMPSWITCH_4 = 0x10;
const CONTROL_STOMPSWITCH_5 = 0x11;
const CONTROL_STOMPSWITCH_6 = 0x12;
const CONTROL_RESERVED = 0x13;
const CONTROL_STOMPSWITCH_A = 0x14;
const CONTROL_STOMPSWITCH_B = 0x15;
const CONTROL_STOMPSWITCH_C = 0x16;
const CONTROL_STOMPSWITCH_D = 0x17;
const CONTROL_FOOTSWITCH_1 = 0x18;
const CONTROL_FOOTSWITCH_2 = 0x19;
const CONTROL_FOOTSWITCH_3 = 0x1A;
const CONTROL_FOOTSWITCH_4 = 0x1B;
const CONTROL_EXPRESSION_PEDAL_1 = 0x36;
const CONTROL_EXPRESSION_PEDAL_2 = 0x37;
const CONTROL_MIDI = 0x7E;
const CONTROL_ALL = 0x7F;

const CONTROLS = {
    [CONTROL_NAME]: "name",
    [CONTROL_STOMPSWITCH_1]: "1",
    [CONTROL_STOMPSWITCH_2]: "2",
    [CONTROL_STOMPSWITCH_3]: "3",
    [CONTROL_STOMPSWITCH_4]: "4",
    [CONTROL_STOMPSWITCH_5]: "5",
    [CONTROL_STOMPSWITCH_6]: "6",
    [CONTROL_RESERVED]: "RESERVED",
    [CONTROL_STOMPSWITCH_A]: "A",
    [CONTROL_STOMPSWITCH_B]: "B",
    [CONTROL_STOMPSWITCH_C]: "C",
    [CONTROL_STOMPSWITCH_D]: "D",
    [CONTROL_FOOTSWITCH_1]: "FS 1",
    [CONTROL_FOOTSWITCH_2]: "FS 2",
    [CONTROL_FOOTSWITCH_3]: "FS 3",
    [CONTROL_FOOTSWITCH_4]: "FS 4",
    [CONTROL_EXPRESSION_PEDAL_1]: "EXP 1",
    [CONTROL_EXPRESSION_PEDAL_2]: "EXP 2",
    [CONTROL_MIDI]: "MIDI configuration",
    [CONTROL_ALL]: "ALL"
};

const CONTROL_MODE_ELEMENT = 0x60;

/**
 * Parse a single sysex message
 * @param data
 * @returns {*}
 */
function parseSysexMessage(data) {

    //TODO: verify checksum

    const dump = hs(data);

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
        // bytes: data      // FIXME: consolidate data per preset
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
        // message[tgt][idx]["name"] = getPresetName(data.slice(ELM));
        console.log("NAME ".padStart(30) + dump);
    }

    if (obj_type === "control") {

        // message[tgt][idx][CONTROLS_DATA] = {
        //     [obj]: {
        //         steps: {}
        //     }
        // };
        // console.log("   CONTROLS_DATA");
        console.log("CONTROLS_DATA ".padStart(30) + dump);

        if (data.length > 9) {

            // which element?
            let e = data[ELM];

            if (e >= 0x01 && e <= 0x24) {

                // STEPS
                if (data.length > ELM + 22) {
                    // let s = getControlStep(data.slice(ELM, ELM + 23));
                    // message[tgt][idx][CONTROLS_DATA][obj]["steps"][s.index] = s.config;
                    console.log("STEPS ".padStart(30) + dump);
                } else {
                    console.warn(`parseSysexMessage: data does not contains steps. data.length=${data.length}`, hs(data));
                }

            } else if (e === CONTROL_MODE_ELEMENT) {

                // CONTROL MODE
                // console.log('parseSysexMessage: CONTROL MODE', idx, obj, ELM, data.slice(ELM, data.length - 1), data);

                // let mode_cfg = getControlMode(data.slice(ELM, data.length - 1));
                // message[tgt][idx][CONTROLS_DATA][obj] = mergeDeep(message[tgt][idx][CONTROLS_DATA][obj], mode_cfg);

                console.log("CONTROL_MODE_ELEMENT ".padStart(30) + dump);

            } else if (e >= 0x40 && e <= 0x57) {

                // LED
                // console.log('parseSysexMessage: LED');

                // let led_cfg = getControlLED(data.slice(ELM, data.length - 1));
                // message[tgt][idx][CONTROLS_DATA][obj] = mergeDeep(message[tgt][idx][CONTROLS_DATA][obj], led_cfg);

                console.log("LED ".padStart(30) + dump);

            } else if (e === 0x7F) {

                // ALL
                // console.log('parseSysexMessage: ALL');

                console.log("ALL ".padStart(30) + dump);

            } else {
                console.warn(`parseSysexMessage: unknown element: ${h(e)}`);
                return null;
            }
        } else {

            // message[tgt][idx][CONTROLS_DATA] = {
            //     [obj]: {}
            // };
            console.log("??? ".padStart(30) + dump);
        }

    }

    if (obj_type === "midi") {

        message[tgt][idx]["midi"] = {};

        // which element?
        let e = data[ELM];

        if (e >= 0x01 && e <= 0x60) {

            // SETTINGS
            if (data.length > ELM+19) {
                // let s = getMidiSetting(data.slice(ELM, ELM + 20));
                // message[tgt][idx]["midi"][s.index] = s.config;
                console.log("MIDI ".padStart(30) + dump);
            } else {
                console.warn(`parseSysexMessage: data does not contains steps. data.length=${data.length}`, hs(data));
            }

        } else {
            console.warn(`parseSysexMessage: unknown element: ${h(e)}`);
            return null;
        }

    }


    if (obj_type === "all") {

        // message[tgt][idx]["all"] = {};
        console.log("ALL");
        // // which element?
        // let e = data[ELM];
        //
        // if (e >= 0x01 && e <= 0x60) {
        //
        //     // SETTINGS
        //     if (data.length > ELM+19) {
        //         let s = getMidiSetting(data.slice(ELM, ELM + 20));
        //         message[tgt][idx]["midi"][s.index] = s.config;
        //     } else {
        //         console.warn(`parseSysexMessage: data does not contains steps. data.length=${data.length}`, hs(data));
        //     }
        //
        // } else {
        //     console.warn(`parseSysexMessage: unknown element: ${h(e)}`);
        //     return null;
        // }

    }

    // console.log(JSON.stringify(message));

    return message;

} // parseSysex()


if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}

// Read the file and print its contents.
var fs = require('fs');

var filename = process.argv[2];

/*
fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + filename);
    console.log(data)
});
*/

// If no encoding is specified, then the raw buffer is returned.
var b = fs.readFileSync(filename);


// console.log(typeof b, b[0], b)

// console.log(b.buffer === arrayBuffer);

parseSysexDump(b);
