import {action, computed, makeAutoObservable} from 'mobx';
import {loadPreferences, savePreferences} from "../utils/preferences";
import {
    FULL_DUMP_EXPECTED_BYTES, getFullNonGlobalConfigSysex, isSysexData, parseSysexDump,
    requestAllPresets,
    requestPreset,
    SINGLE_PRESET_EXPECTED_BYTES,
    splitDump
} from "../pacer/sysex";
import {wait} from "../utils/misc";
import {SYSEX_SIGNATURE} from "../pacer/constants";
import {hs} from "../utils/hexstring";
import {stores} from "./index";

export const SYSEX_START = 0xF0;
export const SYSEX_END = 0xF7;

/*
export const batchMessages = (callback, callbackBusy, wait) => {

    console.log("batchMessages: init", wait);

    let messages = [];  // batch of received messages
    let timeout;
    let totalBytesReceived = 0;

    return function() {

        let event = arguments[0];

        //
        // We ignore all messages that are NOT sysex messages:
        //
        if (event.data[0] !== SYSEX_START) {
            console.log("non sysex message ignored");
            return;
        }

        messages.push(event.data);

        totalBytesReceived += event.data.length;

        callbackBusy(totalBytesReceived);

        if (timeout) return;

        console.log("batchMessages: set timeout");
        timeout = setTimeout(() => {
            console.log("batchMessages: timeout elapsed");
            timeout = null;
            const m = messages.slice(); // clone
            messages = [];
            callback(m);    // we pass a clone because we may receive new messages during the callback processing
        }, wait);

    };
};
*/


export class MidiStore {

    stores = null;

    // These two collections will reflect the available MIDI inputs and outputs. We can not directly
    // use the MIDI interface collections because they are not observable.
    inputs = {};
    outputs = {};

    inputInUse = ""; //WebMidi.MIDIInput[] = [];
    outputInUse = ""; //WebMidi.MIDIOutput[] = [];

    bytesReceived = 0;  // for displaying progress when reading

    sendProgress = null;

    constructor(stores) {

        makeAutoObservable(this, {
            stores: false,
            saveHandler: false,
            receiveHandler: false,
            useOutput: action,
            releaseOutput: action,
            updateInputsOutputs: action,
            deviceConnected: computed
        });

        this.stores = stores;
        this.inputs = {};
        this.outputs = {};
        this.inputInUse = ""; //WebMidi.MIDIInput[] = [];
        this.outputInUse = ""; //WebMidi.MIDIOutput[] = [];
        this.bytesReceived = 0;

        this.onStateChange = this.onStateChange.bind(this);     // very important
        this.onMidiMessage = this.onMidiMessage.bind(this);     // very important
        this.requestMidi().then(); //.then(r => console.log(r));
    }

    get deviceConnected() {
        return this.inputInUse && this.outputInUse;
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
                console.log("MIDI add input", this.inputDebugLabel(input.id));
                this.inputs[input.id] = {
                    id: input.id,
                    name: input.name ?? '',
                    connection: input.connection,
                    deviceType: null
                };
            }
        }

        //
        // OUTPUTS
        //
        if (event === null || event.port.type === "output") {

            for (let id of Object.keys(this.outputs)) {  // our array of outputs
                let remove = true;
                for (let output of window.MIDI.outputs.values()) {    // midi interface list of outputs
                    if (output.id === id) {
                        remove = false;
                        break;
                    }
                }
                if (remove) {
                    delete (this.outputs[id]);
                    this.releaseOutput();
                }
            }

            // outputs to add
            for (let output of window.MIDI.outputs.values()) {
                if (this.outputs.hasOwnProperty(output.id)) {
                    // console.log("MidiStore.updateInputsOutputs output already added", output.id, output.type, output.name, output.state, output.connection, this.outputs[output.id].connection);
                    continue;
                }
                // console.warn("MidiStore.updateInputsOutputs add output", output.id, output.type, output.name, output.state, output.connection);
                this.outputs[output.id] = {
                    id: output.id,
                    name: output.name ?? '',
                    connection: output.connection,
                    deviceType: null
                };
            }
        }

    }

    //=============================================================================================

    onMidiMessage(message) {
        if (isSysexData(message.data)) {
            this.bytesReceived += message.data.length;
            this.stores.state.onBusy({busy: true, bytesReceived: this.bytesReceived});
            this.stores.state.deepMergeData(parseSysexDump(message.data));
            // this.stores.state.storeBytes(message.data);
        } else {
            console.log("MIDI message is not a sysex message", hs(message.data))
        }
    }

    //=============================================================================================

    useInput(id, checkDevice = false) {
        // console.log("MidiStore.useInput", id);
        if (this.inputInUse !== id) {   // do we select another device?
            if (this.inputById(id)) {
                console.log("MIDI useInput: ASSIGN INPUT", this.inputDebugLabel(id));
                this.inputInUse = id;
                this.inputById(id).onmidimessage = this.onMidiMessage;
                savePreferences({input_id: id});
                // this.setDeviceRead(false);
            }
        }
    }

    releaseInput() {
        // console.log("MidiStore.releaseInput");
        if (this.inputInUse) {
            const input = this.inputById(this.inputInUse);
            if (input) {
                input.onmidimessage = undefined;
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
        console.log("midiStore.send", hs(messages));
        // if (!this.outputInUse) return;
        this.outputById(outputId ?? this.outputInUse)?.send(messages);
    }

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
        if (sendForReal) {
            this.send(this.sysex(msg));
        }
    };

    //=============================================================================================

    readPacer = (msg, bytesExpected, busyMessage = "Please wait...") => {
        this.bytesReceived = 0;
        this.stores.state.showBusy({busy: true, busyMessage: busyMessage, bytesReceived: 0, bytesExpected});
        // this.saveBytes = false;
        this.sendSysex(msg);
    };

    readPreset(index) {
        // if (midiConnected(this.stores.state.output) && isVal(index)) {
        if (this.deviceConnected) {
            this.readPacer(requestPreset(index), SINGLE_PRESET_EXPECTED_BYTES);
        }
    }

    //=============================================================================================

    /**
     * Request a full dump and save the data in stores.state.bytes
     * @param busyMessage
     */
    readFullDump = (busyMessage = "Please wait...") => {
        // console.log("readFullDump()");
        this.bytesReceived = 0;
        this.stores.state.showBusy({busy: true, busyMessage: busyMessage, bytesReceived: 0, bytesExpected: FULL_DUMP_EXPECTED_BYTES});
        // this.stores.state.clearBytes();
        this.sendSysex(requestAllPresets());
    };

    //=============================================================================================

    /**
     * Send the current data saved in stores.state.bytes
     * @param patch
     */
    sendToPacer = async () => {

        console.log("sendToPacer");

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

        const messages = getFullNonGlobalConfigSysex(this.stores.state.data, true, true)
        // d.forEach(msg => bytes.push(...msg));


        // console.log(this.sendProgress);

        // const messages = splitDump(Array.from(this.stores.state.getBytesPresetsAsBlob()));

        let i = 0;
        let t = messages.length;

        for (const message of messages) {
            i++;
            this.sendProgress = `sending message ${i} of ${t} (${Math.round(i*100/t)}%)`;
            console.log("sendToPacer: send", hs(message));
            await wait(10);
        }

        setTimeout(() => this.sendProgress = null, 2000);
    };

}
