import {action, computed, makeAutoObservable} from 'mobx';
// import {RootStore} from "./index";
import {loadPreferences, savePreferences} from "../utils/preferences";
import {
    FULL_DUMP_EXPECTED_BYTES, isSysexData, mergeDeep, parseSysexDump,
    requestAllPresets,
    requestPreset,
    SINGLE_PRESET_EXPECTED_BYTES,
    splitDump
} from "../pacer/sysex";
import {wait} from "../utils/misc";
import {SYSEX_SIGNATURE} from "../pacer/constants";
import {hs} from "../utils/hexstring";
// import {sysex, SYSEX_END, SYSEX_START, universalSysex, wait, WAIT_BETWEEN_MESSAGES} from "../utils/midi";
// import {
//     DA_SYSEX_MANUFACTURER_ID,
//     DUMP_CONFIGURATION,
//     DUMP_PRESET_NN, REQUEST_PRESET_NUMBER,
//     SYSEX_COMMANDS,
//     SYSEX_ID_REQUEST
// } from "../model/commands";
// import {bytes2str, rangeEquals} from "../utils/arrays";
// import {GLOBAL_MEMORY, NUMBER_OF_PRESETS_SLOTS} from "./memoryStore";
// import {h} from "../utils/hexstring";

/* Note: the state of the connection (closed, open) is not tracked (observed). */
/* Note regarding "deviceInfo*": only one device is (being) checked at a time; */

// export interface Port {
//     id: string;
//     name: string;
//     connection: WebMidi.MIDIPortConnectionState;
//     deviceType: string|null;          // null if unknown
//     deviceVersion?: string;
//     deviceSerial?: string;
// }
//
// export interface Ports {
//     [id: string]: Port
// }

export const SYSEX_START = 0xF0;
export const SYSEX_END = 0xF7;

export const DIRECTION_IN = 0;
export const DIRECTION_OUT = 1;
export const WAIT_BETWEEN_MESSAGES = 100;

export const batchMessages = (callback, callbackBusy, wait) => {

    console.log("batchMessages: init", wait);

    let messages = [];  // batch of received messages
    let timeout;
    let totalBytesReceived = 0;

    return function() {

        // console.log("batchMessages: clear timeout");
        // clearTimeout(timeout);

        let event = arguments[0];

        //
        // We ignore all messages that are NOT sysex messages:
        //
        if (event.data[0] !== SYSEX_START) {
            console.log("non sysex message ignored");
            return;
        }

        messages.push(event.data);

        // console.log("batchMessages, bytes received:", event.data.length);

        totalBytesReceived += event.data.length;

        callbackBusy(totalBytesReceived);

        if (timeout) return;

        console.log("batchMessages: set timeout");

        timeout = setTimeout(() => {
            console.log("batchMessages: timeout elapsed");
            timeout = null;
            callback(messages);
            messages = [];
        }, wait);

        console.log("batchMessages: done");

    };
};


export class MidiStore {

    // stores: RootStore;

    // These two collections will reflect the available MIDI inputs and outputs. We can not directly
    // use the MIDI interface collections because they are not observable.
    // inputs: Ports = {};
    // outputs: Ports = {};

    // outputIdsCheckQueue: string[] = [];    // input port ID
    // outputIdCheckInProgress: string|null = null;            // input port ID
    // deviceCheckHandler: any = null; // window.timeout handler

    // inputInUse: string = ""; //WebMidi.MIDIInput[] = [];
    // outputInUse: string = ""; //WebMidi.MIDIOutput[] = [];
    // deviceRead = false;
    // readingPreset = -1;

    // saveQueue: number[] = [];
    // saveHandler: any = null;    // window.timeout handler
    // saving = false;
    // savingPresetNumber: number = -1;

    // receiveHandler: any = null; // window.timeout handler
    // receiving = false;

    stores = null;

    // These two collections will reflect the available MIDI inputs and outputs. We can not directly
    // use the MIDI interface collections because they are not observable.
    inputs = {};
    outputs = {};

    // outputIdsCheckQueue = [];    // input port ID
    // outputIdCheckInProgress = null;            // input port ID
    // deviceCheckHandler = null; // window.timeout handler

    inputInUse = ""; //WebMidi.MIDIInput[] = [];
    outputInUse = ""; //WebMidi.MIDIOutput[] = [];
    // deviceRead = false;
    // readingPreset = -1;

    // saveQueue = [];
    // saveHandler = null;    // window.timeout handler
    // saving = false;
    // savingPresetNumber = -1;

    // receiveHandler = null; // window.timeout handler
    // receiving = false;

    sendProgress = null;

    constructor(stores) {

        makeAutoObservable(this, {
            stores: false,
            saveHandler: false,
            receiveHandler: false,
            // saveQueue: false,
            // outputIdsCheckQueue: false,
            // deviceCheckHandler: false,
            useOutput: action,
            releaseOutput: action,
            updateInputsOutputs: action,
            // setReadingPreset: action,
            // setSaving: action,
            // deviceFound: computed
            deviceConnected: computed
        });

        this.stores = stores;

        // These two collections will reflect the available MIDI inputs and outputs. We can not directly
        // use the MIDI interface collections because they are not observable.
        this.inputs = {};
        this.outputs = {};

        // this.outputIdsCheckQueue = [];    // input port ID
        // this.outputIdCheckInProgress = null;            // input port ID
        // this.deviceCheckHandler = null; // window.timeout handler

        this.inputInUse = ""; //WebMidi.MIDIInput[] = [];
        this.outputInUse = ""; //WebMidi.MIDIOutput[] = [];
        // this.deviceRead = false;
        // this.readingPreset = -1;

        // this.saveQueue = [];
        // this.saveHandler = null;    // window.timeout handler
        // this.saving = false;
        // this.savingPresetNumber = -1;

        // this.receiveHandler = null; // window.timeout handler
        // this.receiving = false;

        this.onStateChange = this.onStateChange.bind(this);     // very important
        this.onMidiMessage = this.onMidiMessage.bind(this);     // very important
        this.requestMidi().then(); //.then(r => console.log(r));
    }

    get deviceConnected() {
        return this.inputInUse
            && this.outputInUse;
            // && this.inputs[this.inputInUse]?.deviceSerial
            // && this.inputs[this.inputInUse]?.deviceVersion
            // && this.outputs[this.outputInUse]?.deviceSerial
            // && this.outputs[this.outputInUse]?.deviceVersion;
    }

    //=============================================================================================

    async requestMidi() {
        if (window.MIDI) {
            console.log("MIDI already setup");
            this.onStateChange();
            return;
        }
        if (navigator.requestMIDIAccess) {
            try {
                const o = await navigator.requestMIDIAccess({sysex: true});
                this.onMIDISuccess(o);
            } catch (e) {
                console.warn("MIDI requestMIDIAccess denied", e);
                //TODO: tell the user he has denied access to the MIDI interface.
            }
        } else {
            console.warn("ERROR: navigator.requestMIDIAccess not supported", "#state");
        }
    }

    onMIDISuccess(midiAccess) {
        window.MIDI = midiAccess;
        window.MIDI.onstatechange = this.onStateChange;
        this.onStateChange();
    }

    onStateChange(event = null) {
        console.log("MIDI onStateChange", event?.port.type, event?.port.connection, event?.port.name, event?.port.id);
        this.updateInputsOutputs(event);
        this.autoConnectInput();
        this.autoConnectOutput();
    }

    updateInputsOutputs(event) {

        if (!window.MIDI) return;

        //
        // INPUTS
        //

        if (event === null || event.port.type === "input") {

            // Check for inputs to remove from the existing array (because they are no longer being reported by the MIDI back-end).
            for (let id of Object.keys(this.inputs)) {  // our array of inputs
                let remove = true;
                for (let input of window.MIDI.inputs.values()) {    // midi interface list of inputs
                    // console.log("list", id, input.id, input.type, input.name, input.state, input.connection);
                    if (input.id === id) {
                        remove = false;
                        break;
                    }
                }
                if (remove) {
                    // console.log("REMOVE INPUT", this.inputDebugLabel(this.inputs[id].id));
                    // let p = this.inputById(id);
                    // if (p) {
                    //     //remove listeners
                    //     console.log("connectInput: remove message listener", p.id, p.name);
                    //     // @ts-ignore
                    //     p.onmidimessage = null;
                    // } else {
                    //     console.log("connectInput: input not found", this.inputs[id].id, this.inputs[id].name);
                    // }
                    delete (this.inputs[id]);
                    this.releaseInput();
                }
            }

            // Inputs to add
            for (let input of window.MIDI.inputs.values()) {

                if (this.inputs.hasOwnProperty(input.id)) {
                    // console.log("MidiStore.updateInputsOutputs input already added", input.id, input.type, input.name, input.state, input.connection, this.inputs[input.id].connection);
                    this.inputs[input.id].connection = input.connection;
                    continue;
                }

                // New input to add:
                // console.warn("MidiStore.updateInputsOutputs add input", input.id, input.type, input.name, input.state, input.connection);
                console.log("MIDI add input", this.inputDebugLabel(input.id));
                this.inputs[input.id] = {
                    id: input.id,
                    name: input.name ?? '',
                    connection: input.connection,
                    deviceType: null
                };
                // console.warn("MIDI updateInputsOutputs: add message listener", this.inputDebugLabel(input.id), input.onmidimessage, input);
                // input.onmidimessage = this.onMidiMessage;
                input.onmidimessage = batchMessages(
                    messages => {
                        //TODO: only save in bytes array if we receive a sysex. Ignore all other MIDI messages (CC, NOTE, ...)
                        for (let m of messages) {
                            if (isSysexData(m)) {
                                this.stores.state.deepMergeData(parseSysexDump(m));
                                this.stores.state.storeBytes(m);
                            } else {
                                console.log("MIDI message is not a sysex message", hs(m))
                            }
                        }
                        console.log(`handleMidiInputEvent: ${messages.length} messages merged`);
                        this.stores.state.onBusy({busy: false});
                    },
                    (n) => {
                        console.log("call on busy with busy true", n);
                        this.stores.state.onBusy({busy: true, bytesReceived: n});
                    },
                    300
                );
            }
        }

        //
        // OUTPUTS
        //
        if (event === null || event.port.type === "output") {

            for (let id of Object.keys(this.outputs)) {  // our array of outputs
                let remove = true;
                for (let output of window.MIDI.outputs.values()) {    // midi interface list of outputs
                    // console.log("check", id, output.id, output.type, output.name, output.state, output.connection);
                    if (output.id === id) {
                        remove = false;
                        break;
                    }
                }
                if (remove) {
                    // console.warn("remove", id);
                    delete (this.outputs[id]);
                    this.releaseOutput();
                }
            }

            // outputs to add
            for (let output of window.MIDI.outputs.values()) {
                if (this.outputs.hasOwnProperty(output.id)) {
                    console.log("MidiStore.updateInputsOutputs output already added", output.id, output.type, output.name, output.state, output.connection, this.outputs[output.id].connection);
                    continue;
                }
                // console.warn("MidiStore.updateInputsOutputs add output", output.id, output.type, output.name, output.state, output.connection);
                console.log("MIDI add output", this.outputDebugLabel(output.id));
                this.outputs[output.id] = {
                    id: output.id,
                    name: output.name ?? '',
                    connection: output.connection,
                    deviceType: null
                };
                // this.checkNextDevice(output.id);
            }
        }

    }

    onMidiMessage(message) {

        // this.stores.debug.addInMessage(message);
        this.parseMessage(message);

        //TODO: filter messages that are not for us based on the input ID
        // if (!this.isSelectedDevice(message)) return;
        // if (this.receiveHandler) {
        //     return;
        // }
        // this.setReceiving(true);
        // this.receiveHandler = setTimeout(
        //     () => {
        //         this.setReceiving(false);
        //         this.receiveHandler = null;
        //     },
        //     400);
    }

    //=============================================================================================

/*
    isSelectedDevice(message): boolean {
        // @ts-ignore
        return message?.target?.id === this.inputInUse;
    }
*/

/*
    checkNextDevice(outputId = null) {

        // console.log("MIDI checkNextDevice", this.outputDebugLabel(outputId), this.inputInUse || '-', this.outputInUse || '-');

        if (outputId) {
            console.log("MIDI checkNextDevice Add to queue", this.outputDebugLabel(outputId), this.inputInUse || '-', this.outputInUse || '-');
            this.outputIdsCheckQueue.push(outputId);
        }

        if (this.outputIdCheckInProgress) {
            // console.log("MIDI checkNextDevice: a check is already in progress");
            return;
        }

        this.outputIdCheckInProgress = this.outputIdsCheckQueue.pop() || null;
        if (this.outputIdCheckInProgress) {
            console.log("MIDI checkNextDevice Check", this.outputDebugLabel(this.outputIdCheckInProgress));  //, this.inputInUse || '-', this.outputInUse || '-');
            this.deviceCheckHandler = setTimeout(
                () => {
                    console.log("MIDI --- checkNextDevice: reply not received after 500ms; canceling this request", this.outputDebugLabel(this.outputIdCheckInProgress));
                    this.outputIdCheckInProgress = null;
                    this.deviceCheckHandler = null;
                    this.checkNextDevice();
                },
                1000);
            this.sendDeviceIdRequest(this.outputIdCheckInProgress).then();
        } else {
            console.log("MIDI checkNextDevice: no more device to check");
        }
    }
*/

/*
    async sendDeviceIdRequest(outputId: string) {
        console.log("MIDI >>> sendDeviceIdRequest SYSEX_ID_REQUEST", this.outputDebugLabel(outputId));
        this.send(universalSysex(SYSEX_COMMANDS[SYSEX_ID_REQUEST]), outputId);
        // await wait(40);
        // console.log("MIDI >>> sendDeviceIdRequest DUMP_CONFIGURATION");
        // this.send(sysex(SYSEX_COMMANDS[DUMP_CONFIGURATION]));
        // await wait(40);
        // console.log("MIDI >>> sendDeviceIdRequest REQUEST_PRESET_NUMBER");
        // this.send(sysex(SYSEX_COMMANDS[REQUEST_PRESET_NUMBER]));
    }
*/

/*
    async sendDeviceConfigRequest(outputId: string) {
        // console.log("MIDI >>> sendDeviceIdRequest SYSEX_ID_REQUEST", this.outputDebugLabel(outputId), this.outputDebugLabel(this.outputIdCheckInProgress));
        // this.send(universalSysex(SYSEX_COMMANDS[SYSEX_ID_REQUEST]), outputId);
        // await wait(40);
        console.log("MIDI >>> sendDeviceConfigRequest DUMP_CONFIGURATION", this.outputDebugLabel(outputId));
        this.send(sysex(SYSEX_COMMANDS[DUMP_CONFIGURATION]), outputId);
        await wait(40);
        console.log("MIDI >>> sendDeviceConfigRequest REQUEST_PRESET_NUMBER", this.outputDebugLabel(outputId));
        this.send(sysex(SYSEX_COMMANDS[REQUEST_PRESET_NUMBER]), outputId);
    }
*/

/*
    addDeviceVersion(inputId: string, data: Uint8Array) {
        const v = this.stores.memory.decodeAsVersion(data.slice(2, 6));
        console.log("MIDI addDeviceVersion", v, this.inputDebugLabel(inputId), this.outputDebugLabel(this.outputIdCheckInProgress));
        this.inputs[inputId].deviceVersion = v;
        if (this.outputIdCheckInProgress) {
            // console.log("MIDI addDeviceVersion: add to output", this.outputDebugLabel(this.outputIdCheckInProgress));
            this.outputs[this.outputIdCheckInProgress].deviceVersion = v;
        }
        // this.markDeviceChecked(inputId);
    }
*/

/*
    addDeviceCheckSerial(inputId: string, data: Uint8Array) {
        const sn = bytes2str(data);
        console.log("MIDI addDeviceCheckSerial", sn, this.inputDebugLabel(inputId), this.outputDebugLabel(this.outputIdCheckInProgress));
        this.inputs[inputId].deviceSerial = sn;
        if (this.outputIdCheckInProgress) {
            // console.log("MIDI addDeviceCheckSerial: add to output", this.outputDebugLabel(this.outputIdCheckInProgress));
            this.outputs[this.outputIdCheckInProgress].deviceSerial = sn;
        }
        this.markDeviceChecked(inputId);
    }
*/

/*
    markDeviceChecked(inputId: string) {

        console.log("MIDI markDeviceChecked", this.inputDebugLabel(inputId), this.inputs[inputId].deviceVersion, this.inputs[inputId].deviceSerial);

        if (!this.inputs[inputId].deviceVersion || !this.inputs[inputId].deviceSerial) {
            return;
        }

        if (this.deviceCheckHandler) {
            clearTimeout(this.deviceCheckHandler);
        }

        console.log("MIDI reset checkInProgress and deviceCheckHandler");
        this.outputIdCheckInProgress = null;
        this.deviceCheckHandler = null;
        this.checkNextDevice();
    }
*/

/*
    async preReadDevice() {

        // if (this.deviceFound) {

            console.log("MIDI MidiStore.preReadDevice");

            // this.send(sysex(SYSEX_COMMANDS[DUMP_CONFIGURATION]));
            // await wait(WAIT_BETWEEN_MESSAGES);

            // read first preset (because it will be displayed by default, without the user selecting it explicitly)
            // this.requestCurrentPreset();

            // read first preset (because it will be displayed by default, without the user selecting it explicitly)
            this.send(sysex([...SYSEX_COMMANDS[DUMP_PRESET_NN], 0]));
            await wait(WAIT_BETWEEN_MESSAGES);

            this.send(sysex(SYSEX_COMMANDS[DUMP_CONFIGURATION]));
            await wait(WAIT_BETWEEN_MESSAGES);

            this.send(sysex(SYSEX_COMMANDS[REQUEST_PRESET_NUMBER]));
            await wait(WAIT_BETWEEN_MESSAGES);

            // read regular presets :
            let tick = 0;
            const max = this.stores.memory.getGlobalParamValue("MAX_PRESET");
            for (let i = 0; i <= (max + 1); i++) {  // 105
                window.setTimeout(() => {
                    if (i <= max) {
                        this.setReadingPreset(i);
                        this.send(sysex([...SYSEX_COMMANDS[DUMP_PRESET_NN], i]));
                    } else {
                        this.setReadingPreset(-1);
                    }
                }, tick++ * 100);
            }

            // read presets 100..105 to get the UTIL names
            for (let i = 0; i <= 5; i++) {
                window.setTimeout(() => {
                    this.send(sysex([...SYSEX_COMMANDS[DUMP_PRESET_NN], 100 + i]));
                }, tick++ * 100);
            }

        // } else {
        //     console.log("MidiStore.preReadDevice: DEVICE OT FOUND YET");
        // }
    }
*/

/*
    setDeviceRead(bool) {
        this.deviceRead = bool;
    }

    setReadingPreset(n: number) {
        this.readingPreset = n;
    }
*/

    //=============================================================================================

    useInput(id, checkDevice = false) {
        // console.log("MidiStore.useInput", id);
        if (this.inputInUse !== id) {   // do we select another device?
            if (this.inputById(id)) {
                console.log("MIDI useInput: ASSIGN INPUT", this.inputDebugLabel(id));
                this.inputInUse = id;
                savePreferences({input_id: id});
                // this.setDeviceRead(false);
                // if (checkDevice && this.outputInUse) this.checkNextDevice(this.outputInUse);
            }
        }
    }

    releaseInput() {
        // console.log("MidiStore.releaseInput");
        if (this.inputInUse) {
            const input = this.inputById(this.inputInUse);
            if (input) {
                // console.log("MidiStore.releaseInput: release event handler");
                // @ts-ignore
                // this.setDeviceRead(false);
            }
        }
        this.inputInUse = "";
    }

    useOutput(id, checkDevice = false) {
        if (this.outputInUse !== id) {
            if (this.outputById(id)) {
                console.log("MIDI useOutput: ASSIGN OUTPUT", id);
                this.outputInUse = id;
                savePreferences({output_id: id});
                // this.setDeviceRead(false);
                // if (checkDevice && this.inputInUse) this.checkNextDevice(this.outputInUse);
            }
        }
    }

    releaseOutput() {
        this.outputInUse = "";
        // this.setDeviceRead(false);
    }

    autoConnectInput() {
        if (this.inputInUse) return;
        const s = loadPreferences();
        if (s.input_id) {
            this.useInput(s.input_id, false);
        }
    }

    autoConnectOutput() {
        // console.log(`Midi.autoConnectOutput`);
        if (this.outputInUse) return;
        const s = loadPreferences();
        if (s.output_id) {
            this.useOutput(s.output_id, false);
        }
    }

    inputById(id) {
        if (!id) return null;
        // @ts-ignore
        for (let port of window.MIDI.inputs.values()) {
            if (port.id === id) {
                return port;
            }
        }
        return null;
    }

    outputById(id) {
        if (!id) return null;
        // @ts-ignore
        for (let port of window.MIDI.outputs.values()) {
            if (port.id === id) {
                return port;
            }
        }
        return null;
    }

    inputDebugLabel(id) {
        return id ? ('[IN ' + id.substring(0, 5) + ' ' + this.inputById(id)?.name + ']').trim() : '[IN -]';
    }

    outputDebugLabel(id) {
        return id ? ('[OUT ' + id.substring(0, 5) + ' ' + this.outputById(id)?.name + ']').trim() : '[OUT -]';
    }

    //=============================================================================================

    // universalSysex(data /*number[]*/) /*Uint8Array*/ {
    //     //TODO: clamp the numbers to 0..255
    //     return new Uint8Array([
    //         SYSEX_START,
    //         ...data,
    //         SYSEX_END
    //     ]);
    // }

    sysex(data /*number[]*/) /*Uint8Array*/ {
        //TODO: clamp the numbers to 0..255
        return new Uint8Array([
            SYSEX_START,
            ...SYSEX_SIGNATURE,
            ...data,
            SYSEX_END
        ]);
    }

    //=============================================================================================

    send(messages, outputId) {
        // console.log("MidiStore.send");
        // if (!this.outputInUse) return;
        // @ts-ignore
        // this.stores.debug.addOutMessage(messages);
        this.outputById(outputId ?? this.outputInUse)?.send(messages);
    }

    //=============================================================================================

/*
    parseMessage(message) {

        // @ts-ignore
        // const forTheConnectedDevice = message.currentTarget.id === this.inputInUse;
        // console.log("parseMessage", h(message.data[0]), message);

        const data = message.data;

        if (data[0] === SYSEX_START) {
            if (data[data.length-1] !== SYSEX_END) {
                console.warn("MIDI parseMessage: invalid sysex, missing EOX");
                return;
            }
            // @ts-ignore
            this.parseSysex(message.data, false, message.target?.id);
        } else if ((data[0] & 0xF0) === 0xC0) {
            // console.log("MIDI PC received", data[1], this.stores.stores.state.lastUserSelectPreset);
            if (this.isSelectedDevice(message)) {
                if (this.stores.stores.state.lastUserSelectPreset !== data[1]) {
                    this.requestCurrentPreset();
                }
            }
        }
    }
*/

    /**
     * use force=true to import a sysex from a file
     * @param data
     * @param force
     * @param inputId
     * @return a string for information, telling what kind of sysex has been parsed
     */
/*
    parseSysex(data: Uint8Array, force = false, inputId?: string): string {

        // ID request :
        //  in F0 7E 00 06 02 00 02 17 01 02 02 0B 00 06 F7
        // out F0 7E 00 06 01 F7

        const forSelectedDevice = force || (inputId === this.inputInUse);

        console.log("MIDI parseSysex: forSelectedDevice?", forSelectedDevice, this.inputDebugLabel(inputId ?? null))

        if (rangeEquals(data, 1, [0x7E, 0x00, 0x06, 0x02]) && rangeEquals(data, 5, DA_SYSEX_MANUFACTURER_ID)) {
            // ID request response

            if (inputId) {
                console.log("MIDI <<< deviceId received", this.inputDebugLabel(inputId));
                this.addDeviceVersion(inputId, data.slice(8, 8 + 6));
                // this.inputs[deviceId].deviceInfo = hs(data.slice(8, 8 + 6));
            }

            if (forSelectedDevice) {
                this.stores.memory.setVersion(data.slice(8, 8 + 6));
                // this.setDeviceFound(true);
                this.preReadDevice().then();
            } else {
                if (this.outputIdCheckInProgress) {
                    this.sendDeviceConfigRequest(this.outputIdCheckInProgress).then();
                } else {
                    console.warn("MIDI unable to sendDeviceConfigRequest");
                }
            }

            return "ID";
        }

        // if (!forSelectedDevice) return "ignored";

        if (!rangeEquals(data, 1, DA_SYSEX_MANUFACTURER_ID)) {
            // console.log("parseSysex: message is not for us (ID manufacturer is not DA)");
            return "ignored";
        }

        let info = "ignored";

        if (forSelectedDevice && (data.length === 6) && this.deviceFound) {

            console.log("MIDI <<< preset number received", this.inputDebugLabel(inputId ?? null));

            this.stores.stores.state.selectPreset(data[4], true);
            info = "preset-number";

        } else {
            switch (data[4]) {
                case 0x57:
                    // console.log("parseSysex: Write Serial Number");
                    break;
                case 0x58:
                    // console.log("parseSysex: Write Preset Name");
                    break;
                case 0x7C:
                    // console.log("parseSysex: Store preset nn");
                    break;
                case 0x7D:
                    // console.log("parseSysex: Store preset nn");
                    if (forSelectedDevice) {
                        this.stores.memory.setPreset(Array.from(data));
                        info = "preset";
                    } else {
                        info = "ignored";
                    }
                    break;
                case 0x7E:
                    // console.log("parseSysex: Dump configuration");
                    break;
                case 0x7F:
                    // console.log("parseSysex: Store configuration");
                    console.log("MIDI <<< configuration received", this.inputDebugLabel(inputId ?? null));
                    if (inputId) {
                        this.addDeviceCheckSerial(inputId, data.slice(5, 9));
                    }
                    if (forSelectedDevice) {
                        this.stores.memory.setGlobal(Array.from(data));
                        this.setDeviceRead(true);
                        // this.setConfiguration(data.slice(5, -1));
                        info = "configuration";
                    } else {
                        // if (deviceId) {
                        //     this.addDeviceCheckSerial(deviceId, data.slice(5, 9));
                        // }
                        info = "ignored";
                    }
                    break;
                default:
                    // console.log("parseMessage: not sysex");
                    break;
            }
        }

        return info;
    }
*/

    //=============================================================================================

/*
    requestCurrentPreset()  {
        if (this.deviceFound) {
            this.send(sysex(SYSEX_COMMANDS[REQUEST_PRESET_NUMBER]));
        }
    }
*/

    //=============================================================================================

/*
    setSaving(saving) {
        this.saving = saving;
    }

    setReceiving(receiving) {
        this.receiving = receiving;
    }

    saveGlobal() {
        // console.log("saveGlobal")
        if (this.deviceFound) {
            this.send(Uint8Array.from(this.stores.memory.global));
            this.stores.memory.markDirtyGlobalParamsAsSaved();
        }
    }

    savePreset(presetNumber: number) {
        // console.log("savePreset", presetNumber)
        if (this.deviceFound) {
            this.send(Uint8Array.from(this.stores.memory.presets[presetNumber]));
            this.stores.memory.markDirtyPresetParamsAsSaved(presetNumber);
        }
    }

    save(presetNumber = GLOBAL_MEMORY) {
        if (!this.deviceFound) {
            return;
        }
        if (!this.saveQueue.includes(presetNumber)) {
            this.saveQueue.push(presetNumber);
        }
        if (this.saveHandler) {
            return;
        }
        this.saveHandler = setTimeout(
            async () => {
                this.setSaving(true);
                setTimeout(() => {  // we want to show the saving indicator for at least N ms
                    this.setSaving(false);
                }, 400);
                for (let n of this.saveQueue) {
                    if (n === GLOBAL_MEMORY) {
                        this.saveGlobal();
                    } else {
                        this.savePreset(n);
                    }
                    await wait(WAIT_BETWEEN_MESSAGES);
                }
                this.saveQueue = [];
                this.saveHandler = null;
            },
            500);
    }

    cancelSave() {
        // console.log("cancel save");
        clearTimeout(this.saveHandler);
        this.saveHandler = null;
    }

    setSavingPreset(number: number) {
        this.savingPresetNumber = number;
    }

    async saveAllPresets() {
        if (!this.deviceFound) {
            return;
        }
        // this.saveGlobal();
        for (let number=0; number<NUMBER_OF_PRESETS_SLOTS; number++) {
            this.setSavingPreset(number);
            this.savePreset(number);
            await wait(WAIT_BETWEEN_MESSAGES);
        }
        this.setSavingPreset(-1);
    }

    async saveAll() {
        if (!this.deviceFound) {
            return;
        }
        this.saveGlobal();
        for (let number=0; number<NUMBER_OF_PRESETS_SLOTS; number++) {
            this.setSavingPreset(number);
            this.savePreset(number);
            await wait(WAIT_BETWEEN_MESSAGES);
        }
        this.setSavingPreset(-1);
    }
*/

    sendSysex = (msg, sendForReal = true) => {
        if (!this.outputInUse) {
            console.warn("no output enabled to send the message");
            return;
        }
        let out = this.outputById(this.outputInUse);
        if (!out) {
            console.warn(`send: output ${this.outputInUse} not found`);
            return;
        }
        // console.log("sendSysex", msg, hs(msg));
        if (sendForReal) {
            this.send(this.sysex(msg));
            // out.sendSysex(SYSEX_SIGNATURE, msg);
        }
    };


    readPacer = (msg, bytesExpected, busyMessage = "Please wait...") => {
        this.stores.state.showBusy({busy: true, busyMessage: busyMessage, bytesReceived: 0, bytesExpected});
        this.saveBytes = false;
        this.sendSysex(msg);
    };

    readPreset(index) {
        // if (midiConnected(this.stores.state.output) && isVal(index)) {
        if (this.deviceConnected) {
            this.readPacer(requestPreset(index), SINGLE_PRESET_EXPECTED_BYTES);
        }
    }

    /**
     * Request a full dump and save the data in stores.state.bytes
     * @param busyMessage
     */
    readFullDump = (busyMessage = "Please wait...") => {
        // console.log("readFullDump()");
        this.stores.state.showBusy({busy: true, busyMessage: busyMessage, bytesReceived: 0, bytesExpected: FULL_DUMP_EXPECTED_BYTES});
        this.stores.state.clearBytes();
        this.sendSysex(requestAllPresets());
    };

    /**
     * Send the current data saved in stores.state.bytes
     * @param patch
     */
    sendDump = async () => {

        // console.log("sendDump");

        if (!this.outputInUse) {
            console.warn("sendPatch: no output enabled to send the message");
            return;
        }

        // let out = this.outputById(this.stores.state.output);
        // if (!out) {
        //     console.warn(`send: output ${this.stores.state.output} not found`);
        //     return;
        // }

        // this.showBusy({busy: true, busyMessage: "sending dump..."});

        this.sendProgress = 'building sysex messages...';
        await wait(20); // to force an update to of the UI to display the above message

        // console.log(this.sendProgress);

        const messages = splitDump(Array.from(this.stores.state.getBytesPresetsAsBlob()));

        let i = 0;
        let t = messages.length;

        for (const message of messages) {
            i++;
            this.sendProgress = `sending message ${i} of ${t} (${Math.round(i*100/t)}%)`;
            this.sendSysex(message);
            await wait(10);
        }

        setTimeout(() => this.sendProgress = null, 2000);
    };

}
