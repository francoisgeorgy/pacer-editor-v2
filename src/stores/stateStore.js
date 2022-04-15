import React from "react";
import {action, makeAutoObservable} from "mobx";
import {ALL_CONTROLS, MSG_CTRL_OFF, TARGET_PRESET} from "../pacer/constants";
import {
    getPresetNameSysexMessages,
    CONTROLS_DATA,
    getControlUpdateSysexMessages,
    getMidiSettingUpdateSysexMessages,
    isSysexData,
    parseSysexDump, MIDI_DATA, STEPS_DATA, getPresetConfigSysex, getFullNonGlobalConfigSysex
} from "../pacer/sysex";
import {MAX_FILE_SIZE, wait} from "../utils/misc";
import {hs} from "../utils/hexstring";
import {presetIndexToXY} from "../pacer/utils";
import {stores} from "./index";

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

    data = null;
    bytesGlobal = [];
    overviewSelection = [];  // presets selected in overview
    currentPresetIndex = "";    // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
    currentControl = "13";   // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
    updateMessages = {};
    busy = false;
    busyMessage = "Receiving data, please wait...";
    bytesExpected = -1;
    progress = -1;    // 0..100
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
            readFiles: action,
            updatePacer: action,
            sendDump: action,
            deepMergeData: action,
            setChanged: action,
            clearUpdateMessages: action,
            copyFromTo: action
        });

        this.stores = stores;

        this.data = null;
        this.bytesGlobal = [];
        this.overviewSelection = [];  // presets selected in overview
        this.currentPresetIndex = "";    // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
        this.currentControl = "13";   // must be a string because it is used as a property name (object key) (https://stackoverflow.com/questions/3633362/is-there-any-way-to-use-a-numeric-type-as-an-object-key)
        this.updateMessages = {};
        this.busy = false;
        this.busyMessage = "Receiving data, please wait...";
        this.bytesExpected = -1;
        this.progress = -1;    // 0..100
        this.decBase = true;  // true --> decimal base, false --> hex base for number
        this.extControls = true;
        this.forceReread = false;
        this.changed = false;
        this.D6InfoVisible = false;
        this.D6InfoHidden = false;
        this.detailView = false;

    }

    clearUpdateMessages() {
        this.updateMessages = {};
    }

    clear() {
        console.log("state: clear data");
        this.overviewSelection = [];
        this.currentPresetIndex = "";
        this.currentControl = "13";
        this.clearUpdateMessages();
        this.data = null;
        this.updateMessages = {};
    }

    initData() {
        Object.values(this.data[TARGET_PRESET])
            .forEach(preset => {
                preset['name'] = 'toto'
                Object.values(preset[CONTROLS_DATA])
                    .forEach(control => {
                        control['control_mode'] = 0;
                        Object.values(control[STEPS_DATA])
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
    }

    setChanged(bool) {
        this.changed = bool;
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

    clearBusyHandler = null;

    onBusy({busy = false, busyMessage = null, bytesExpected = -1, bytesReceived = -1} = {}) {

        // console.log("StateStore.onBusy", busy, busyMessage, bytesExpected, bytesReceived, this.bytesExpected, this.busy);

        let show = (busy !== this.busy) ||
                   ((busyMessage !== null) && (busyMessage !== this.busyMessage)) ||    // buyMessage is not null and has changed
                   (bytesExpected > 0 && bytesExpected !== this.bytesExpected);     // bytesExpected is not null and has changed

        let progress = -1;
        if (this.bytesExpected > 0 && bytesReceived > 0) {
            progress = Math.round(bytesReceived / this.bytesExpected * 100 / 5) * 5;
            show = show || ((progress >= 0) && (progress !== this.progress));
            // console.log("StateStore.onBusy %", progress, show);
        }


        if (show) {

            console.log("onBusy", show);

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

        if (this.clearBusyHandler) {
            clearTimeout(this.clearBusyHandler);
        }
        if (busy) {
            this.clearBusyHandler = setTimeout(() => this.onBusy({busy: false}), 1000);
        }

    };

    showBusy({busy = false, busyMessage = null, bytesExpected = -1, bytesReceived = -1} = {}) {
        // console.log("showBusy init, bytes expected, received:", bytesExpected, bytesReceived);
        // setTimeout(() => this.onBusy({busy: false}), 20000);
        this.onBusy({busy: true, busyMessage, bytesExpected, bytesReceived});
    }

    hideBusy(delay = 0) {
        if (delay < 1) {
            this.onBusy({busy: false});
        } else {
            setTimeout(() => this.onBusy({busy: false}), delay);
        }
    }

    getOverviewSelectionInfo() {
        return this.overviewSelection.map(i => presetIndexToXY(i)).sort().join(' ');
    }

    togglePresetOverviewSelection(presetIndex) { // String
        const i = this.overviewSelection.indexOf(presetIndex);
        if (i >= 0) {
            this.overviewSelection.splice(i, 1);
        } else {
            this.overviewSelection.push(presetIndex);
        }
    }

    selectAllPresets() {
        //TODO: only select presets which have been read (which have data)
        this.overviewSelection = [
            '0',
            '1', '2', '3', '4', '5', '6', '7', '8',
            '9', '10', '11', '12', '13', '14', '15', '16',
            '17', '18', '19', '20', '21', '22', '23', '24'
        ];
    }

    clearPresetSelection() {
        this.currentPresetIndex = "";
        this.overviewSelection = [];
    }

    noneSelected() {
        return this.overviewSelection.length < 1;
    }

    someSelected() {
        return this.overviewSelection.length > 0;
    }

    allSelected() {
        return this.overviewSelection.length > 24;
    }

    selectPreset(presetIndex) { // String
        // console.log("selectPreset", presetIndex, typeof presetIndex);
        this.currentPresetIndex = presetIndex;
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

        this.updateMessages[presetIndex]["name"]["dummy"] = getPresetNameSysexMessages(presetIndex, this.data);

        // console.log("name", presetIndex, JSON.stringify(this.data[TARGET_PRESET][presetIndex]["name"]));

        this.changed = true;
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
        //TODO: if external control, set withLed = false
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

    /**
     * dataIndex is only used when dataType == "data"
     */
    updateControlStepMessageType(controlId, stepIndex, value, preset = this.currentPresetIndex) {

        // console.log(`updateControlStep(${controlId}, ${stepIndex}, ${dataType}, ${dataIndex}, ${value})`);

        let v = parseInt(value, 10);

        this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["msg_type"] = v;

        if (v === MSG_CTRL_OFF) {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["active"] = 0;
        } else {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["active"] = 1;
        }

        this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["changed"] = true;

        this.addControlUpdateMessage(controlId, getControlUpdateSysexMessages(preset, controlId, this.data));

        this.changed = true;
    }

    /**
     * dataIndex is only used when dataType == "data"
     */
    updateControlStep(controlId, stepIndex, dataType, dataIndex, value, preset = this.currentPresetIndex) {

        console.log(`updateControlStep(${controlId}, ${stepIndex}, ${dataType}, ${dataIndex}, ${value})`);

        let v = value === '' ? 0 : parseInt(value, 10);

        if (isNaN(v)) {
            return;
        }

        if (dataType === "data") {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["data"][dataIndex] = v;
        } else {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex][dataType] = v;
        }

        // if (dataType === "msg_type") {
        //     if (v === MSG_CTRL_OFF) {
        //         this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["active"] = 0;
        //     } else {
        //         this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["active"] = 1;
        //     }
        // }

        if (dataType.startsWith("led_")) {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["led_changed"] = true;
        } else {
            this.data[TARGET_PRESET][preset][CONTROLS_DATA][controlId][STEPS_DATA][stepIndex]["changed"] = true;
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

        if (dataType === "data") {
            this.data[TARGET_PRESET][P][MIDI_DATA][settingIndex]["data"][dataIndex] = v;
        } else {
            this.data[TARGET_PRESET][P][MIDI_DATA][settingIndex][dataType] = v;
        }

        if (dataType === "msg_type") {
            if (v === MSG_CTRL_OFF) {
                this.data[TARGET_PRESET][P][MIDI_DATA][settingIndex]["active"] = 0;
            } else {
                this.data[TARGET_PRESET][P][MIDI_DATA][settingIndex]["active"] = 1;
            }
        }

        this.data[TARGET_PRESET][P][MIDI_DATA][settingIndex]["changed"] = true;

        this.changed = true;

        if (!this.updateMessages.hasOwnProperty(P)) this.updateMessages[P] = {};
        if (!this.updateMessages[P].hasOwnProperty(MIDI_DATA)) this.updateMessages[P][MIDI_DATA] = {};

        //TODO: update the methods that read updateMessages to allow object or array
        this.updateMessages[P][MIDI_DATA]["dummy"] = getMidiSettingUpdateSysexMessages(P, this.data);
    }

    clearPreset(presetId) {

        if (presetId < 0) return false;

        console.log(`clear preset ${presetId}`);

        if (this.data && this.data[TARGET_PRESET][presetId]) {

            if (!this.updateMessages.hasOwnProperty(presetId)) this.updateMessages[presetId] = {};
            if (!this.data[TARGET_PRESET][presetId]) this.data[TARGET_PRESET][presetId] = {};

            this.data[TARGET_PRESET][presetId]["name"] = "";
            if (!this.updateMessages[presetId].hasOwnProperty("name")) this.updateMessages[presetId]["name"] = {};
            this.updateMessages[presetId]["name"]["dummy"] = getPresetNameSysexMessages(presetId, this.data);

            Object.keys(this.data[TARGET_PRESET][presetId][CONTROLS_DATA])
                .forEach(controlId => {
                    // console.log("clearPreset", presetId, controlId);
                    this.data[TARGET_PRESET][presetId][CONTROLS_DATA][controlId]['control_mode'] = 0;
                    Object.values(this.data[TARGET_PRESET][presetId][CONTROLS_DATA][controlId][STEPS_DATA])
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
                    this.addControlUpdateMessage(controlId, getControlUpdateSysexMessages(presetId, controlId, this.data, true));
                });

            this.data[TARGET_PRESET][presetId][MIDI_DATA] = {};
            for (let k=1; k<=16; k++) { // MUST start at 1
                this.data[TARGET_PRESET][presetId][MIDI_DATA][k] = {
                    channel: 0,
                    msg_type: MSG_CTRL_OFF,
                    data: [0, 0, 0]
                };
            }
            // console.log(JSON.stringify(this.data[TARGET_PRESET][presetId][MIDI_DATA]));
            // if (!this.updateMessages[presetId].hasOwnProperty(MIDI_DATA))
                this.updateMessages[presetId][MIDI_DATA] = {
                    "dummy": getMidiSettingUpdateSysexMessages(presetId, this.data)
                };
            // console.log("MIDI_DATA", JSON.stringify(this.updateMessages[presetId][MIDI_DATA]));
            // this.updateMessages[presetId][MIDI_DATA]["dummy"] = getMidiSettingUpdateSysexMessages(presetId, this.data);

            // this.addControlUpdateMessage(controlId, getControlUpdateSysexMessages(presetId, controlId, this.data));

            this.data[TARGET_PRESET][presetId]["changed"] = true;
            this.changed = true;
        }
    }

    /**
     *
     * @param presetIdFrom
     * @param presetIdTo
     * @return {boolean}
     */
    copyFromTo(presetIdFrom, presetIdTo) {

        if (presetIdFrom < 0 || presetIdTo < 0) return false;

        if (this.data && this.data[TARGET_PRESET][presetIdFrom]) {

            const presetFrom = this.data[TARGET_PRESET][presetIdFrom];
            this.data[TARGET_PRESET][presetIdTo] = {[CONTROLS_DATA]: {}, [MIDI_DATA]: {}};
            const presetTo = this.data[TARGET_PRESET][presetIdTo];

            console.log(`copy preset ${presetIdFrom} to ${presetIdTo}`);
            // console.log(JSON.stringify(this.data[TARGET_PRESET][presetIdTo][CONTROLS_DATA]));

            // this.clearPreset(presetIdTo);

            // if (!this.updateMessages.hasOwnProperty(presetIdTo))
            // this.updateMessages[presetIdTo] = {[CONTROLS_DATA]: {}, [MIDI_DATA]: {}};
            // if (!this.data[TARGET_PRESET][presetIdTo]) this.data[TARGET_PRESET][presetIdTo] = {};

            // Name:

            this.updatePresetName(presetIdTo, this.data[TARGET_PRESET][presetIdFrom]["name"]);

            // Controls:

            // this.data[TARGET_PRESET][presetIdTo][CONTROLS_DATA] = null;

            // this.data[TARGET_PRESET][presetIdTo][CONTROLS_DATA] = JSON.parse(JSON.stringify(this.data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA]));
            presetTo[CONTROLS_DATA] = JSON.parse(JSON.stringify(presetFrom[CONTROLS_DATA]));
            presetTo[MIDI_DATA] = JSON.parse(JSON.stringify(presetFrom[MIDI_DATA]));

            // console.log("presetFrom", JSON.stringify(presetFrom));
            console.log("presetTo", JSON.stringify(presetTo, null, 4));

            // ALL_CONTROLS.forEach(controlId => {
            //     this.addControlUpdateMessage(controlId, getControlUpdateSysexMessages(presetIdTo, controlId, this.data, true, false));
            // });

            // Preset MIDI:

            // this.data[TARGET_PRESET][presetIdTo][MIDI_DATA] = JSON.parse(JSON.stringify(this.data[TARGET_PRESET][presetIdFrom][MIDI_DATA]));

            // if (!this.updateMessages[presetIdTo].hasOwnProperty(MIDI_DATA))
            // this.updateMessages[presetIdTo][MIDI_DATA] = {};
            // this.updateMessages[presetIdTo][MIDI_DATA]["dummy"] = getMidiSettingUpdateSysexMessages(presetIdTo, this.data);

            // CONTROLS_WITH_SEQUENCE.forEach(controlId => {
            //     // data[TARGET_PRESET][presetIdTo][CONTROLS_DATA][controlId] = Object.assign({}, data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA][controlId]);
            //     // ugly / deep copy without shallow references:
            //     this.data[TARGET_PRESET][presetIdTo][CONTROLS_DATA][controlId] = JSON.parse(JSON.stringify(this.data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA][controlId]));
            //     updateMessages[presetIdTo][CONTROLS_DATA][controlId] = getControlUpdateSysexMessages(presetIdTo, controlId, this.data, true);
            // });

/*
            Object.values(this.data[TARGET_PRESET][presetIdTo][CONTROLS_DATA])
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
*/

            this.data[TARGET_PRESET][presetIdTo]["changed"] = true;
            this.changed = true;

            // console.log("presetFrom", JSON.stringify(getPresetConfigSysex(presetIdFrom, this.data)));
            // console.log("presetTo", JSON.stringify(getPresetConfigSysex(presetIdTo, this.data)));

            // this.stores.state.deepMergeData(parseSysexDump(message.data));

            this.updateMessages[presetIdTo] = {
                "all": {
                    "all": getPresetConfigSysex(presetIdTo, this.data)
                }
            };

        }
        /*
                const { data, updateMessages } = this.state;

                if (data && data[TARGET_PRESET][presetIdFrom]) {

                    if (!data[TARGET_PRESET][presetIdTo]) data[TARGET_PRESET][presetIdTo] = {};
                    data[TARGET_PRESET][presetIdTo]["changed"] = true;

                    if (!updateMessages.hasOwnProperty(presetIdTo)) updateMessages[presetIdTo] = {};
                    if (!updateMessages[presetIdTo].hasOwnProperty(CONTROLS_DATA)) updateMessages[presetIdTo][CONTROLS_DATA] = {};

                    //
                    // Only copy CONTROLS (for the current version)
                    //
                    //FIXME: copy EXP and FS config
                    CONTROLS_WITH_SEQUENCE.forEach(controlId => {
                        // data[TARGET_PRESET][presetIdTo][CONTROLS_DATA][controlId] = Object.assign({}, data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA][controlId]);
                        // ugly / deep copy without shallow references:
                        data[TARGET_PRESET][presetIdTo][CONTROLS_DATA][controlId] = JSON.parse(JSON.stringify(data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA][controlId]));
                        updateMessages[presetIdTo][CONTROLS_DATA][controlId] = getControlUpdateSysexMessages(presetIdTo, controlId, data, true);
                    });
                    // Object.assign(data[TARGET_PRESET][presetIdTo], data[TARGET_PRESET][presetIdFrom]);

                    //we do not copy the name
                    //updateMessages[presetIdTo]["name"] = buildPresetNameSysex(presetIdTo, data);

                    // CONTROLS_WITH_SEQUENCE.forEach(controlId => updateMessages[presetIdTo][CONTROLS_DATA][controlId] = getControlUpdateSysexMessages(presetIdTo, controlId, data, true));

                    this.setState({data, updateMessages, changed: true});
                }
        */

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

/*
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
*/

/*
    storeBytes(messages) {

        let i = 0;
        let cont = true;
        while (cont) {
            i = messages.indexOf(SYSEX_START, i);
            if (i < 0) break;

            i++;
            let k = messages.indexOf(SYSEX_END, i);
            let m = messages.slice(i-1, k+1)
            const target = getDataTarget(m);
            if (target.isPresetName) {
                // console.log("receiving a preset; clear bytes");
                this.bytesPresets[target.presetNum] = [];
            }
            if (target.isPreset) {
                this.bytesPresets[target.presetNum].push(m);
            } else if (target.isGlobal) {
                this.bytesGlobal.push(m);
                // console.log("storeBytes: global");
            } else {
                console.warn("storeBytes: unsupported message", m);
            }
        }
    }
*/

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
                        // this.data = mergeDeep(this.data || {}, parseSysexDump(data))
                        this.deepMergeData(parseSysexDump(data));
                        // this.storeBytes(data);
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

    async updatePacer() {

        this.showBusy({busy: true, busyMessage: "write Preset..."});

        const messages = [];

        Object.getOwnPropertyNames(this.updateMessages).forEach(
            presetId => {
                Object.getOwnPropertyNames(this.updateMessages[presetId]).forEach(
                    ctrlType => {
                        Object.getOwnPropertyNames(this.updateMessages[presetId][ctrlType]).forEach(
                            ctrl => {
                                this.updateMessages[presetId][ctrlType][ctrl].forEach(
                                    msg => {
                                        // console.warn(presetId, ctrlType, ctrl);
                                        // await this.stores.midi.sendSysex(msg);
                                        messages.push(this.stores.midi.sysex(msg));
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );

        await stores.midi.sendToPacer(messages)
            .then(() => wait(200))
            .then(() => {
                console.log("send done");
                this.setChanged(false);
                this.clearUpdateMessages();
                this.stores.midi.readPreset(this.currentPresetIndex);
            });
            // .then(r => () => console.log("done sending sysex"));

        // setTimeout(
        //     () => {
        //         this.setChanged(false);
        //         this.clearUpdateMessages();
        //         this.stores.midi.readPreset(this.currentPresetIndex);
        //     },
        //     1000
        // );
    }

} // class StateStore
