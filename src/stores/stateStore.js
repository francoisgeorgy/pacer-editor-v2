import {computed, action, makeAutoObservable, observable} from "mobx";
import {outputById} from "../utils/ports";
import {MSG_CTRL_OFF, SYSEX_SIGNATURE, TARGET_PRESET} from "../pacer/constants";
import {
    buildPresetNameSysex,
    CONTROLS_DATA,
    FULL_DUMP_EXPECTED_BYTES,
    getBytesIndex,
    getControlUpdateSysexMessages,
    getMidiSettingUpdateSysexMessages,
    isSysexData,
    mergeDeep,
    parseSysexDump,
    requestAllPresets,
    requestPreset,
    SINGLE_PRESET_EXPECTED_BYTES,
    splitDump,
    SYSEX_END,
    SYSEX_START
} from "../pacer/sysex";
import {flatDeep, MAX_FILE_SIZE, wait} from "../utils/misc";
import {hs} from "../utils/hexstring";
import React from "react";

/**
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/34749873#34749873
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export class StateStore {

    // stores = null;

    // this.stores = stores;

    data = null;
    bytesPresets = [[], [], [],    // current, track, transport
        [], [], [], [], [], [],    // A1..A6
        [], [], [], [], [], [],    // B1..B6
        [], [], [], [], [], [],    // C1..C6
        [], [], [], [], [], []]    // D1..D6
    bytesGlobal = [];
    overviewSelection = [];  // presets selected in overview
    currentPresetIndex = "";    // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
    currentControl = "13";   // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
    updateMessages = {};
    // midi = {
    //     inputs: [],         // array of MIDI inputs (filtered from WebMidi object)
    //     outputs: [],        // array of MIDI outputs (filtered from WebMidi object)
    //     input: 0,        // MIDI output port enabled
    //     output: 0        // MIDI output port enabled,
    // };
    // pacerPresent = false;
    busy = false;
    busyMessage = "Receiving data, please wait...";
    bytesExpected = -1;
    progress = -1;    // 0..100
    //TODO:
    decBase = true;  // true --> decimal base, false --> hex base for number
    extControls = true;
    forceReread = false;
    changed = false;
    D6InfoVisible = false;
    D6InfoHidden = false;
    detailView = false;

    constructor(stores) {

        // {
        //     "1":{                            // TARGET_PRESET
        //         "0":{                        // CURRENT preset
        //             "name":"NOTES",
        //             "controls":{...},
        //             "midi":{...}
        //         },
        //         "1":{                        // A1
        //             "name":"PRGM1",
        //             "controls":{...},
        //             "midi":{...}
        //         },
        //         ...
        //     },
        //     "5":{                            // TARGET_GLOBAL
        //         ...
        //     }
        // }

        makeAutoObservable(this, {
            stores: false,
            clearBytes: action,
            clear: action,
            initData: action,
            showD6Info: action,
            hideD6Info: action,
            toggleDetailView: action,
            setDetailView: action,
            toggleForceReread: action,
            setForceReread: action,
            onBusy: action,
            togglePresetOverviewSelection: action,
            clearPresetSelection: action,
            selectPreset: action,
            selectControl: action,
            setControlMode: action,
            addControlUpdateMessage: action,
            updatePresetName: action,
            updateControlStepMessageType: action,
            updateControlStep: action,
            updateMidiSettings: action,
            readPacer: action,
            storeBytes: action,
            readFiles: action,
            updatePacer: action,
            sendDump: action,
            deepMergeData: action
        });

        this.stores = stores;

        this.data = null;
        this.bytesPresets = [[], [], [],    // current, track, transport
                             [], [], [], [], [], [],    // A1..A6
                             [], [], [], [], [], [],    // B1..B6
                             [], [], [], [], [], [],    // C1..C6
                             [], [], [], [], [], []]    // D1..D6
        this.bytesGlobal = [];
        this.sendProgress = null;
        this.overviewSelection = [];  // presets selected in overview
        this.currentPresetIndex = "";    // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
        this.currentControl = "13";   // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
        this.updateMessages = {};
        // this.midi = {
        //     inputs: [],         // array of MIDI inputs (filtered from WebMidi object)
        //     outputs: [],        // array of MIDI outputs (filtered from WebMidi object)
        //     input: 0,        // MIDI output port enabled
        //     output: 0        // MIDI output port enabled,
        // };
        // this.pacerPresent = false;
        this.busy = false;
        this.busyMessage = "Receiving data, please wait...";
        this.bytesExpected = -1;
        this.progress = -1;    // 0..100
        //TODO:
        this.decBase = true;  // true --> decimal base, false --> hex base for number
        this.extControls = true;
        this.forceReread = false;
        this.changed = false;
        this.D6InfoVisible = false;
        this.D6InfoHidden = false;
        this.detailView = false;

    }

    //TODO:
    // bytes:
    // bytesPresets = [preset-index][]
    // bytesGlobals = []

    // pacerConnected() {
    //     return this.midi.output > 0 && this.midi.input > 0;
    // }

    // get connected() {
    //     // console.log("get connected", this.midi.input, this.midi.output);
    //     return this.midi.output !== 0 && this.midi.input !== 0;
    // }

    clearBytes() {
        this.bytesPresets = [[], [], [],    // current, track, transport
            [], [], [], [], [], [],    // A1..A6
            [], [], [], [], [], [],    // B1..B6
            [], [], [], [], [], [],    // C1..C6
            [], [], [], [], [], []]    // D1..D6
        this.bytesGlobal = [];
    }

    clear() {
        console.log("state: clear data");
        this.overviewSelection = [];
        this.currentPresetIndex = "";
        this.currentControl = "13";
        this.updateMessages = {};
        this.data = null;
        this.clearBytes();
        this.updateMessages = {};
    }

    initData() {

        Object.values(this.data[TARGET_PRESET])
            .forEach(preset => {
                preset['name'] = 'toto'
                Object.values(preset['controls'])
                    .forEach(control => {
                        control['control_mode'] = 0;
                        Object.values(control['steps'])
                            .forEach(step => {
                                step["channel"] = 0;
                                    step["msg_type"] = MSG_CTRL_OFF;
                                    step["data"] = [0,0,0];
                                    step["active"] = 0;
                                    step["led_midi_ctrl"] = 0;
                                    step["led_active_color"] = 0;
                                    step["led_inactive_color"] = 0;
                                    step["led_num"] = 0;
                            });
                    });
            });

        // this.data = parse(this.data.slice());

        // this.bytesPresets = [[], [], [],    // current, track, transport
        //     [], [], [], [], [], [],    // A1..A6
        //     [], [], [], [], [], [],    // B1..B6
        //     [], [], [], [], [], [],    // C1..C6
        //     [], [], [], [], [], []]    // D1..D6
        // const presets = [];
        // for (let i=0; i<27; i++) {
        //     const preset = [];
        //     // for (let k=0; k<27; i++) {
        //     //
        //     // }
        //     presets.push(preset);
        // }
        // this.bytesPresets = presets;
        // this.bytesGlobal = [];
    }

    /**
     * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge/34749873#34749873
     * Deep merge two objects.
     * @param target
     * @param ...sources
     */
    deepMerge(target, ...sources) {

        if (!sources.length) return target;

        const source = sources.shift();

        if (isObject(target) && isObject(source)) {
            for (const key in source) {
                if (isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.deepMerge(target, ...sources);
    }

    deepMergeData(sources) {
        this.data = this.deepMerge(this.data || {}, sources);
    }

    showD6Info() {
        // if hidden, keep it hidden
        if (!this.D6InfoHidden) this.D6InfoVisible = true;
        console.log("showD6Info()", this.D6InfoVisible);
    }

    hideD6Info() {
        this.D6InfoVisible = false;
        this.D6InfoHidden = true;
    }

    toggleDetailView = () => {
        this.detailView = !this.detailView;
    }

    setDetailView = (bool) => {
        this.detailView = bool;
    }

    toggleForceReread = () => {
        this.forceReread = !this.forceReread;
    }

    setForceReread = (bool) => {
        this.forceReread = bool;
    }

    onBusy({busy = false, busyMessage = null, bytesExpected = -1, bytesReceived = -1} = {}) {

        console.log("StateStore.onBusy", busy, busyMessage, bytesExpected, bytesReceived, this.bytesExpected, this.busy);

        let show = busy !== this.busy;
        show = show || (busyMessage !== null && busyMessage !== this.busyMessage);
        show = show || (bytesExpected > 0 && bytesExpected !== this.bytesExpected);

        let progress = -1;
        if (this.bytesExpected > 0 && bytesReceived > 0) {
            progress = Math.round(bytesReceived / this.bytesExpected * 100 / 5) * 5;
            show = show || ((progress >= 0) && (progress !== this.progress));
            console.log("StateStore.onBusy %", progress, show);
        }

        if (show) {
            if (this.busy !== busy) this.busy = busy;
            if (busyMessage !== null) this.busyMessage = busyMessage;
            if (bytesExpected > 0 && bytesExpected !== this.bytesExpected) this.bytesExpected = bytesExpected;
            if (busy === false) {
                this.bytesExpected = -1;
                this.progress = -1;
            } else {
                if (bytesExpected > 0) this.bytesExpected = bytesExpected;
                if (this.progress !== progress) {
                    this.progress = progress;
                }
            }
        }
    };

    showBusy({busy = false, busyMessage = null, bytesExpected = -1, bytesReceived = -1} = {}) {
        console.log("showBusy init, bytes expected, received:", bytesExpected, bytesReceived);
        setTimeout(() => this.onBusy({busy: false}), 20000);
        this.onBusy({busy: true, busyMessage, bytesExpected, bytesReceived});
    }

    hideBusy(delay = 0) {
        if (delay < 1) {
            this.onBusy({busy: false});
            // this.sendProgress = null;
        } else {
            setTimeout(() => this.onBusy({busy: false}), delay);
        }
    }

    togglePresetOverviewSelection(presetIndex) { // String
        const i = this.overviewSelection.indexOf(presetIndex);
        if (i >= 0) {
            this.overviewSelection.splice(i, 1);
        } else {
            this.overviewSelection.push(presetIndex);
        }
    }

    clearPresetSelection() {
        this.currentPresetIndex = "";
    }

    selectPreset(presetIndex) { // String
        // console.log("selectPreset", presetIndex, typeof presetIndex);
        this.currentPresetIndex = presetIndex;
    }

    selectControl(controlIndex) {
        // console.log("selectControl", controlIndex, typeof controlIndex);
        this.currentControl = controlIndex;
    }

    /**
     * Update the control mode of the currentControl of the currentPresetIndex
     * @param value
     */
    setControlMode(value) {
        this.data[TARGET_PRESET][this.currentPresetIndex][CONTROLS_DATA][this.currentControl]["control_mode"] = value;
        this.data[TARGET_PRESET][this.currentPresetIndex][CONTROLS_DATA][this.currentControl]["control_mode_changed"] = true;
        this.addControlUpdateMessage(this.currentControl, getControlUpdateSysexMessages(this.currentPresetIndex, this.currentControl, this.data));
        this.changed = true;
    }

    addControlUpdateMessage(controlId, msg) {
        if (!this.updateMessages.hasOwnProperty(this.currentPresetIndex)) {
            this.updateMessages[this.currentPresetIndex] = {};
        }
        if (!this.updateMessages[this.currentPresetIndex].hasOwnProperty(CONTROLS_DATA)) {
            this.updateMessages[this.currentPresetIndex][CONTROLS_DATA] = {};
        }
        this.updateMessages[this.currentPresetIndex][CONTROLS_DATA][controlId] = msg;
    }

    updatePresetName(presetIndex, name) {

        if (name === undefined || name === null) return;

        if (name.length > 5) {
            console.warn(`Presets.updateName: name too long: ${name}`);
            return;    // Calling .setState with null no longer triggers an update in React 16.
        }

        this.data[TARGET_PRESET][presetIndex]["name"] = name;
        this.data[TARGET_PRESET][presetIndex]["changed"] = true;     //TODO: used?


        if (!this.updateMessages.hasOwnProperty(presetIndex)) this.updateMessages[presetIndex] = {};
        if (!this.updateMessages[presetIndex].hasOwnProperty("name")) this.updateMessages[presetIndex]["name"] = {};

        this.updateMessages[presetIndex]["name"]["dummy"] = buildPresetNameSysex(presetIndex, this.data);

        this.changed = true;
    }

    /**
     * dataIndex is only used when dataType == "data"
     */
    updateControlStepMessageType(controlId, stepIndex, value, preset = this.currentPresetIndex) {

        // console.log(`updateControlStep(${controlId}, ${stepIndex}, ${dataType}, ${dataIndex}, ${value})`);

        let v = parseInt(value, 10);

        this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["msg_type"] = v;

        if (v === MSG_CTRL_OFF) {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["active"] = 0;
        } else {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["active"] = 1;
        }

        this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["changed"] = true;

        this.addControlUpdateMessage(controlId, getControlUpdateSysexMessages(preset, controlId, this.data));

        this.changed = true;
    }

    /**
     * dataIndex is only used when dataType == "data"
     */
    updateControlStep(controlId, stepIndex, dataType, dataIndex, value, preset = this.currentPresetIndex) {

        console.log(`updateControlStep(${controlId}, ${stepIndex}, ${dataType}, ${dataIndex}, ${value})`);

        let v = parseInt(value, 10);

        // const data = this.props.stores.state.data;
        // const presetIndex = this.props.stores.state.currentPreset;
        // const updateMessages = this.props.stores.state.updateMessages;

        if (dataType === "data") {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["data"][dataIndex] = v;
        } else {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex][dataType] = v;
        }

        // if (dataType === "msg_type") {
        //     if (v === MSG_CTRL_OFF) {
        //         this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["active"] = 0;
        //     } else {
        //         this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["active"] = 1;
        //     }
        // }

        if (dataType.startsWith("led_")) {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["led_changed"] = true;
        } else {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId]["steps"][stepIndex]["changed"] = true;
        }

        this.addControlUpdateMessage(controlId, getControlUpdateSysexMessages(preset, controlId, this.data));

        this.changed = true;
    }

    /**
     * dataIndex is only used when dataType == "data"
     */
    updateMidiSettings(settingIndex, dataType, dataIndex, value) {

        let v = parseInt(value, 10);

        const P = this.currentPresetIndex;

        // console.log("updateMidiSettings", settingIndex, dataType, dataIndex, value, v, P);

        // this.setState(
        //     produce(draft => {
                if (dataType === "data") {
                    this.data[TARGET_PRESET][P]["midi"][settingIndex]["data"][dataIndex] = v;
                } else {
                    this.data[TARGET_PRESET][P]["midi"][settingIndex][dataType] = v;
                }
                if (dataType === "msg_type") {
                    if (v === MSG_CTRL_OFF) {
                        this.data[TARGET_PRESET][P]["midi"][settingIndex]["active"] = 0;
                    } else {
                        this.data[TARGET_PRESET][P]["midi"][settingIndex]["active"] = 1;
                    }
                }
                this.data[TARGET_PRESET][P]["midi"][settingIndex]["changed"] = true;

                this.changed = true;

                if (!this.updateMessages.hasOwnProperty(P)) this.updateMessages[P] = {};
                if (!this.updateMessages[P].hasOwnProperty("midi")) this.updateMessages[P]["midi"] = {};

                //FIXME: update the methods that read updateMessages to allow object or array
                this.updateMessages[P]["midi"]["dummy"] = getMidiSettingUpdateSysexMessages(P, this.data);

            // })
        // );
    }

/*
    sendAny = msg => {
        if (!this.midi.output) {
            console.warn("no output enabled to send the message");
            return;
        }
        let out = outputById(this.midi.output);
        if (!out) {
            console.warn(`send: output ${this.midi.output} not found`);
            return;
        }
        console.log("sendAny", msg);
        out.send(msg);
    };
*/


    getBytesPresetsAsBlob() {
        // const a = [];
        // this.bytesPresets.forEach(
        //     p => p.forEach(
        //         b => a.push(...b)
        //     )
        // );
        // return a;
        return new Uint8Array(flatDeep(this.bytesPresets, 100));
    }

    isBytesPresetEmpty() {
        return !this.bytesPresets.some(e => e && e.length > 0);
    }

    storeBytes(messages) {

        let i = 0;
        let cont = true;
        while (cont) {
            i = messages.indexOf(SYSEX_START, i);
            if (i < 0) break;

            i++;
            let k = messages.indexOf(SYSEX_END, i);
            let m = messages.slice(i-1, k+1)
            const bi = getBytesIndex(m);
            if (bi) {
                if (bi.isPresetName) {
                    // console.log("receiving a preset; clear bytes");
                    this.bytesPresets[bi.presetNum] = [];
                }
                if (bi.isPreset) {
                    this.bytesPresets[bi.presetNum].push(m);
                } else if (bi.isGlobal) {
                    this.bytesGlobal.push(m);
                    // console.log("storeBytes: global");
                } else {
                    console.warn("storeBytes: unsupported message", m);
                }
            }

        }
    }

    async readFiles(files) {

        // console.log("readFiles", files);

        // this.bytes = null;

        // let data = this.data;
        await Promise.all(files.map(
            async file => {
                if (file.size > MAX_FILE_SIZE) {
                    console.warn(`${file.name}: file too big, ${file.size}`);
                    this.hideBusy();
                } else {

                    console.log("readFiles: reading");

                    this.showBusy({busy: true, busyMessage: "loading file..."});

                    const data = new Uint8Array(await new Response(file).arrayBuffer());

                    if (isSysexData(data)) {
                        // console.log("readFiles: file is sysex");
                        this.data = mergeDeep(this.data || {}, parseSysexDump(data))
                        this.storeBytes(data);
                    } else {
                        console.log("readFiles: not a sysex file", hs(data.slice(0, 5)));
                    }
                    this.hideBusy();
                    // non sysex files are ignored
                }
                // too big files are ignored
            }
        ));
        // this.props.stores.state.data = data;
    }

    updatePacer() {
        //FIXME: externalize this method

        this.showBusy({busy: true, busyMessage: "write Preset..."});

        Object.getOwnPropertyNames(this.updateMessages).forEach(
            presetId => {
                Object.getOwnPropertyNames(this.updateMessages[presetId]).forEach(
                    ctrlType => {
                        Object.getOwnPropertyNames(this.updateMessages[presetId][ctrlType]).forEach(
                            ctrl => {
                                this.updateMessages[presetId][ctrlType][ctrl].forEach(
                                    msg => {
                                        this.stores.midi.sendSysex(msg);
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );

        //FIXME: update this code
        setTimeout(
            () => {
                this.changed = false;
                this.updateMessages = {};
                this.stores.midi.readPreset(this.currentPresetIndex);
            },
            1000
        );
    }


} // class StateStore

// export default new StateStore();
// export const state = new StateStore();
