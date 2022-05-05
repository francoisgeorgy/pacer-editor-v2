import {action, computed, makeAutoObservable} from 'mobx';
import {loadPreferences, savePreferences} from "../utils/preferences";
import {
    FULL_DUMP_EXPECTED_BYTES, getMessageTarget, isSysexData, parseSysexDump,
    requestAllPresets,
    requestPreset,
    SINGLE_PRESET_EXPECTED_BYTES
} from "../pacer/sysex";
import {wait} from "../utils/misc";
import {SYSEX_SIGNATURE} from "../pacer/constants";
import {hs} from "../utils/hexstring";
import {presetIndexToXY} from "../pacer/utils";

export const SYSEX_START = 0xF0;
export const SYSEX_END = 0xF7;

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
            setSendProgress: action,
            deviceConnected: computed,
            abort: false
        });

        this.stores = stores;
        this.inputs = {};
        this.outputs = {};
        this.inputInUse = ""; //WebMidi.MIDIInput[] = [];
        this.outputInUse = ""; //WebMidi.MIDIOutput[] = [];
        this.bytesReceived = 0;

        this.abort = false;

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
            this.stores.state.onBusy({busy: true, progressCurrent: this.bytesReceived});
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

        // for(let i=0; i<data.length; i++) {
        //     if (data[i] > 127) console.error("sysex", i, data[i], data);
        // }

        return new Uint8Array([
            SYSEX_START,
            ...SYSEX_SIGNATURE,
            ...data,
            SYSEX_END
        ]);
    }

    //=============================================================================================

    async send(messages, outputId) {
        console.log("midiStore.send", hs(messages));
        // if (!this.outputInUse) return;
        this.outputById(outputId ?? this.outputInUse)?.send(messages);
        await wait(50);
    }

    sendSysex = async (msg, sendForReal = true) => {

        // for(let i=0; i<msg.length; i++) {
        //     if (msg[i] > 127) console.error("sendSysex", i, msg[i], msg);
        // }

        if (!this.outputInUse) {
            console.warn("no output enabled to send the message");
            return;
        }
        let out = this.outputById(this.outputInUse);
        if (!out) {
            console.warn(`send: output ${this.outputInUse} not found`);
            return;
        }

        // console.log("sendSysex", msg, this.sysex(msg));

        if (sendForReal) {
            await this.send(this.sysex(msg));
        }
    };

    //=============================================================================================

    readPacer = (msg, max, busyMessage = "Reading preset...") => {
        this.bytesReceived = 0;
        this.stores.state.showBusy({busy: true, busyMessage: busyMessage, progressCurrent: 0, max});
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
    readFullDump = (busyMessage = "Reading all presets...") => {
        this.bytesReceived = 0;
        this.stores.state.showBusy({busy: true, busyMessage: busyMessage, progressCurrent: 0, max: FULL_DUMP_EXPECTED_BYTES});
        // this.stores.state.clearBytes();
        this.sendSysex(requestAllPresets());
    };

    //=============================================================================================

    abortSend() {
        this.abort = true;
    }

    setSendProgress(msg) {
        this.sendProgress = msg;
    }

    /**
     * Send the current data saved in stores.state.bytes
     * @param patch
     */
    sendToPacer = async (messages, showProgress=true, showBusy=true) => {

        console.log("sendToPacer");

        if (!this.outputInUse) {
            console.warn("sendPatch: no output enabled to send the message");
            return;
        }

        if (showProgress) {
            this.sendProgress = 'building sysex messages...';
            await wait(20); // to force an update to of the UI to display the above message
        }

        let i = 0;
        let t = messages.length;

        this.stores.state.showBusy({busy: true, busyMessage: "sending presets...", progressCurrent: 0, max: t, abortButton: true});

        this.abort = false;
        for (const message of messages) {
            if (this.abort) break;
            if (!message) continue;
            i++;
            if (showProgress) this.setSendProgress(`sending... ${Math.round(i*100/t)}% (${presetIndexToXY(getMessageTarget(message))})`);
            if (showBusy) this.stores.state.onBusy({busy: true, progressCurrent: i});
            await this.send(message);
        }

        if (showProgress) {
            setTimeout(() => this.setSendProgress(null), 1000);
        }

        if (showBusy) {
            this.stores.state.onBusy({busy: false});
        }
    };

}
