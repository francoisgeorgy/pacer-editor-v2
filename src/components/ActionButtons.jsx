import React, {Component, useRef} from "react";
import {observer} from "mobx-react-lite";
import {stores} from "../stores";

export const ActionButtons = observer(() => {

    // constructor(props) {
    //     super(props);
    //     this.inputOpenFileRef = React.createRef();
    // }

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
        const data = stores.state.data;

        // console.log("connected", stores.state.connected);

        const canRead = stores.state.connected;
        const canWrite = stores.state.connected && stores.state.changed;

        return (
            <div className="preset-buttons">

                {canRead &&
                <button className="action-button read"
                       onClick={() => stores.state.readFullDump()}
                       title="Read all presets from Pacer">Read Pacer</button>}
                {!canRead && <div></div>}

                {canWrite && <button className="action-button update" onClick={() => stores.state.updatePacer()}>Update Pacer</button>}
                {!canWrite && <div></div>}

                <input ref={inputOpenFileRef} type="file" style={{display:"none"}} onChange={onChangeFile} />
                <button className="action-button" onClick={onInputFile}>Load sysex file</button>

                <div>{/* empty grid cell */}</div>

                {data && <button className="action-button" onClick={clearData}>CLEAR ALL</button>}
                {!data && <div>{/* empty grid cell */}</div>}

                <div>
                </div>
            </div>
        );
    // }
});

/*
    <div className="preset-buttons col align-col-bottom">
        <div>Click any preset to load only this preset.</div>
        {data && <button onClick={this.toggleExtControls}>{this.stores.state.extControls ? "Hide external controls" : "Show external controls"}</button>}
        {data && <button onClick={this.toggleBase}>{this.stores.state.decBase ? "Display numbers in hex" : "Display numbers in dec"}</button>}
    </div>
*/

// export default inject('state')(observer(ActionButtons));
