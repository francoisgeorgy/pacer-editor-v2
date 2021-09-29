import React, {useRef, useState} from 'react';
import {stores} from "../stores";
import {TARGET_PRESET} from "../pacer/constants";
import {presetIndexToXY} from "../pacer/utils";
// import Dropzone from "react-dropzone";
// import {dropOverlayStyle} from "../utils/misc";
import {observer} from "mobx-react-lite";
import {BusyIndicator} from "../components/BusyIndicator";
import {DownloadAllPresets} from "../components/DownloadAllPresets";
import "./Patch.css";

export const Patch = observer(() => {
// class Patch extends Component {

    // constructor(props) {
    //     super(props);
    //     this.inputOpenFileRef = React.createRef();
    //     this.state = {
    //         dropZoneActive: false,
    //         status: null
    //     };
    // }

    // const [dropZoneActive, setDropZoneActive] = useState(false);
    const [status, setStatus] = useState(null);
    const inputOpenFileRef = useRef(null);

    function onChangeFile(e) {
        let file = e.target.files[0];
        stores.state.readFiles([file]);
    }

    function onInputFile(e) {
        inputOpenFileRef.current.click();
    }

    // function onDragEnter() {
    //     setDropZoneActive(true);
    //     // this.setState({
    //     //     dropZoneActive: true
    //     // });
    // }
    //
    // function onDragLeave() {
    //     setDropZoneActive(false);
    //     // this.setState({
    //     //     dropZoneActive: false
    //     // });
    // }

    /**
     * Drop Zone handler
     * @param files
     */
    // function onDrop(files) {
    //     setDropZoneActive(false);
    //     stores.state.readFiles(files);
    //     // this.setState(
    //     //     {
    //     //         dropZoneActive: false
    //     //     },
    //     //     () => {
    //     //         //TODO
    //     //         stores.state.readFiles(files);
    //     //     }   // returned promise from readFiles() is ignored, this is normal.
    //     // );
    // }

    function sendDump() {
        stores.state.sendDump();
    }

    // render() {

        // console.log("patch render");

        // const { status } = this.state;
        // const { status, dropZoneActive } = this.state;
        // const output = stores.state.midi.output;
        const data = stores.state.data;

        // const q =  QueryString.parse(window.location.search);
        // const debug = q.debug ? q.debug === '1' : false;

        return (

/*
            <Dropzone
                disableClick
                style={{position: "relative"}}
                onDrop={this.onDrop}
                onDragEnter={this.onDragEnter}
                onDragLeave={this.onDragLeave}>

                {dropZoneActive &&
                <div style={dropOverlayStyle}>
                    Drop sysex file...
                </div>}
*/

                <div className="wrapper">
                    <div className="content">

                        <div className="content-row-content first dump-wrapper">

                            <h2>Import/Export presets</h2>

                            <div className="">
                                <p>
                                    This page allows you to import/export all the Pacer presets, or a selection, at once.
                                </p>
                                <p>
                                    The Global Config is not read or written by this tool.
                                </p>
                            </div>

                            <div className="mt-10">
                                <h3>Pacer &#x279C; save to file :</h3>
                                {stores.state.connected &&
                                <div>
                                    {stores.state.connected && <button className="action-button Xread" onClick={() => stores.state.readFullDump()}>Read Pacer</button>}
                                    <DownloadAllPresets />
                                    <BusyIndicator className="space-left inline-busy" busyMessage={"reading pacer:"} />
                                </div>}
                                {!stores.state.connected &&
                                <div className="mb-15 italic">
                                    Pacer not connected.
                                </div>}
                            </div>

                            <div className="mt-10">
                                <h3>Read file &#x279C; Pacer :</h3>
                                <input ref={inputOpenFileRef} type="file" style={{display:"none"}} onChange={onChangeFile} />
                                <button className="action-button" onClick={onInputFile}>Load sysex file</button>
                                {data && stores.state.connected && <button className="action-button Xupdate" onClick={sendDump}>Send to Pacer</button>}
                                {stores.state.sendProgress && <span>{stores.state.sendProgress}</span>}
                            </div>

                            <div className="mt-10">
                                <h3>Data included in the dump:</h3>
                                <p>
                                    Presets marked "no data" are ignored and will not be sent to your Pacer or included in the sysex file.
                                </p>
                            </div>

                            <div className="patch-content">
                            {
                                Array.from(Array(24+1).keys()).map(
                                index => {
                                    let id = presetIndexToXY(index);
                                    let show = data && data[TARGET_PRESET] && data[TARGET_PRESET][index];
                                    let name = show ? data[TARGET_PRESET][index]["name"] : "";

                                    if (index === 0) return null;

                                    return (
                                        <div key={index}>
                                            {/*<div className="right-align">{index}</div>*/}
                                            <div>{id}</div>
                                            {show ? <div>{name}</div> : <div className="placeholder">no data</div>}
                                        </div>
                                    );
                                })
                            }
                            </div>

                            {status &&
                            <div className={`status ${status.severity}`}>
                                {status.message}
                            </div>}

                            {/* data && <div className="Xpreset-buttons">
                                <button onClick={() => stores.state.clear()}>CLEAR DATA</button>
                            </div> */}

                        </div>

                    </div>

                </div>

            // </Dropzone>
        );
    // }
});

// export default inject('state')(observer(Patch));
