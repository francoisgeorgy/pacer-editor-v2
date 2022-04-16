import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import "./MidiPortsSelect.css";

export const MidiPortsSelect = observer(() => {

    function handleInSelection(e) {
        e.preventDefault();
        // const v = (e.target as HTMLSelectElement).value;
        const v = e.currentTarget.value;
        // stores.midi.useInput(v, message => {console.log(message)});
        stores.midi.useInput(v, true);
    }

    function handleOutSelection(e) {
        e.preventDefault();
        // // console.log('handleOutSelection', (e.target as HTMLSelectElement).value);
        // const v = (e.target as HTMLSelectElement).value;
        const v = e.currentTarget.value;
        stores.midi.useOutput(v, true);
    }

    function portLabel(port) {
        let s = port.name;
        if (port.deviceVersion) {
            s = s + ' (' + port.deviceVersion;
            if (port.deviceSerial) {
                s = s + ' SN ' + port.deviceSerial;
            }
            s = s + ')';
        }
        return s;
    }

    // @ts-ignore
    // if (!window.MIDI) {
    //     return null;
    // }

    const midi_ok = true;

    // console.log("MidiPortsSelect", stores.midi.outputs);
    // console.log("MidiPortsSelect", stores.midi.inputs);

    return (
        <div className={`midi-ports ${midi_ok?'midi-ok':'midi-ko'}`}>
            <div>
                <span>MIDI input: </span>
                <select onChange={handleInSelection} value={stores.midi.inputInUse} className={stores.midi.inputInUse ? '' : 'bg-warning'}>
                    <option value="">select MIDI input...</option>
                    {Object.entries(stores.midi.inputs).map(([id, port]) => <option key={id} value={port.id}>{portLabel(port)}</option>)}
                </select>
            </div>
            <div>
                <span>MIDI output: </span>
                <select onChange={handleOutSelection} value={stores.midi.outputInUse} className={stores.midi.outputInUse ? '' : 'bg-warning'}>
                    <option value="">select MIDI output...</option>
                    {Object.entries(stores.midi.outputs).map(([id, port]) => <option key={id} value={port.id}>{portLabel(port)}</option>)}
                </select>
            </div>
            {/*<MidiFeedback />*/}
        </div>
    );

});
