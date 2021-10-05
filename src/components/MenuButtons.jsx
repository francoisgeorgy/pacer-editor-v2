import React, {useRef} from "react";
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import FACTORY_PRESETS from "../data/factory-presets.json";
import {mergeDeep, parseSysexDump} from "../pacer/sysex";

export const MenuButtons = observer(() => {

    const inputOpenFileRef = useRef(null);

    function onChangeFile(e) {
        let file = e.target.files[0];
        if (file) {
            stores.state.readFiles([file]).then(() => console.log("done reading files"));
        }
    }

    function onInputFile(e) {
        inputOpenFileRef.current.click()
    }

    function loadFactoryDefaults() {
        const data = Uint8Array.from(Object.values(FACTORY_PRESETS));
        // stores.state.data = mergeDeep(parseSysexDump(data));
        stores.state.deepMergeData(parseSysexDump(data));
    }

    function clearData() {
        stores.state.clear();
        stores.state.clearPresetSelection();
    }

/*
    toggleExtControls = e => {
        const extControls = !this.stores.state.extControls;
        this.setState({extControls});
    };
    toggleBase = e => {
        const decBase = !this.stores.state.decBase;
        this.setState({decBase});
    };
*/

    const canRead = stores.midi.deviceConnected;
    const canWrite = stores.midi.deviceConnected && stores.state.changed;

    return (
        <div className="menu-buttons">

            <button className={`action-button read ${canRead ? "" : "disabled"}`}
                    disabled={canRead ? "" : true}
                    onClick={() => stores.midi.readFullDump()}
                    title="Read all presets from the Pacer">Read Pacer</button>

            <button className={`action-button update ${canWrite ? "" : "disabled"}`}
                    disabled={canWrite ? "" : true}
                    onClick={() => stores.state.updatePacer()}
                    title="Save the changes in the Pacer">Update Pacer</button>

            <input ref={inputOpenFileRef} type="file" style={{display:"none"}} onChange={onChangeFile} />
            <button className="action-button" onClick={onInputFile}
                    title="Import the presets configuration with a SysEx file">Load sysex file</button>

            <button className="action-button" onClick={loadFactoryDefaults}
                    title="Load the Factory Preset">Load Factory</button>

            <button className="action-button" onClick={clearData}
                    title="Clear the editor memory">Reset editor</button>

        </div>
    );

});
