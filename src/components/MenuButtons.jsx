import React, {Component, useRef} from "react";
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import FACTORY_PRESETS from "../data/factory-presets.json";
import {mergeDeep, parseSysexDump} from "../pacer/sysex";

/* copied from ActionButtons */

export const MenuButtons = observer(() => {

    const inputOpenFileRef = useRef(null);

    function onInputFile(e) {
        inputOpenFileRef.current.click()
    }

    function onChangeFile(e) {
        let file = e.target.files[0];
        // noinspection JSIgnoredPromiseFromCall
        if (file) {
            stores.state.readFiles([file]);
        }
    }

    function loadFactoryDefaults() {
        // console.log("FACTORY_PRESETS", typeof FACTORY_PRESETS, FACTORY_PRESETS);
        const data = Uint8Array.from(Object.values(FACTORY_PRESETS));
        // console.log("data", data);
        stores.state.data = mergeDeep(parseSysexDump(data));
        // stores.state.storeBytes(data);
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

    // render() {
        // const output = stores.state.midi.output;
        // const data = stores.state.data;

        // console.log("connected", stores.state.connected);

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
    // }
});

/*
    <div className="preset-buttons col align-col-bottom">
        <div>Click any preset to load only this preset.</div>
        {data && <button onClick={toggleExtControls}>{stores.state.extControls ? "Hide external controls" : "Show external controls"}</button>}
        {data && <button onClick={toggleBase}>{stores.state.decBase ? "Display numbers in hex" : "Display numbers in dec"}</button>}
    </div>
*/

// export default inject('state')(observer(MenuButtons));
