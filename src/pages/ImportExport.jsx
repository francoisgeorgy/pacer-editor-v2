import React, {useRef, useState} from 'react';
import {stores} from "../stores";
import {TARGET_PRESET} from "../pacer/constants";
import {presetIndexToXY} from "../pacer/utils";
import {observer} from "mobx-react-lite";
import {BusyIndicator} from "../components/BusyIndicator";
import {DownloadAllPresets} from "../components/DownloadAllPresets";
import {getFullNonGlobalConfigSysex} from "../pacer/sysex";
import {DownloadHex} from "../components/DownloadHex";
import "./ImportExport.css";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import Switch from "react-switch";
import {DownloadBin} from "../components/DownloadBin";

export const ImportExport = observer(() => {

    const [status, setStatus] = useState(null);
    const inputOpenFileRef = useRef(null);

    function onChangeFile(e) {
        let file = e.target.files[0];
        stores.state.readFiles([file]);
    }

    function onInputFile(e) {
        inputOpenFileRef.current.click();
    }

    function sendDump() {
        stores.state.sendDump();
    }

    const data = stores.state.data;

    return (
        <div className="content">

            <div className="mb-20">
                <PresetSelectorAndButtons showClearButton={true} overview={true}
                                          title="Import/Export presets"
                                          subtitle="Select the presets to export:" />
            </div>

            <div className="content-row-content first dump-wrapper">

                <div className="">
                    {/*<p>*/}
                    {/*    This page allows you to import/export all the Pacer presets, or a selection, at once.*/}
                    {/*</p>*/}
                    <p>
                        The Global Config is not included.
                    </p>
                </div>

                <div className="mt-20">
                    <h3>Export to file :</h3>
                </div>
                <div className="mt-10">
                    {/*{stores.midi.deviceConnected && <button className="action-button" onClick={() => stores.midi.readFullDump()}>Read Pacer</button>}*/}
                    {/*<DownloadAllPresets />*/}
                    {/*<button onClick={() => setFoo(getFullNonGlobalConfigSysex(data, true))}>getFullNonGlobalConfigSysex</button>*/}
                    <DownloadBin data={() => getFullNonGlobalConfigSysex(data, true, true)} filename={`pacer-patch`} addTimestamp={true} label="Export"/>
                    <DownloadBin data={() => getFullNonGlobalConfigSysex(data, false, true)} filename={`pacer-patch`} addTimestamp={true} label="Export ALL"/>
                    <DownloadHex data={() => getFullNonGlobalConfigSysex(data, true, true)} filename={`pacer-patch`} addTimestamp={true} label="Export HEX"/>
                    <BusyIndicator className="space-left inline-busy" busyMessage={"reading pacer:"} />
                </div>

                <div className="mt-20">
                    <h3>Import from file:</h3>
                </div>
                <div className="mt-10">
                    <input ref={inputOpenFileRef} type="file" style={{display:"none"}} onChange={onChangeFile} />
                    <div className="row align-center">
                        <button className="action-button" onClick={onInputFile}>Load sysex file</button>
                        <Switch onChange={(checked) => console.log(checked)} checked={false} width={48} height={20} className="mr-10 align-self-center" /> Clear the editor's data before importing.
                    </div>
                </div>
{/*
                    {data && stores.midi.deviceConnected && <button className="action-button" onClick={sendDump}>Send to Pacer</button>}
                    {stores.state.sendProgress && <span>{stores.state.sendProgress}</span>}
*/}
                {/*</div>*/}

{/*
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
                                <div className="right-align">{index}</div>
                                <div>{id}</div>
                                {show ? <div>{name}</div> : <div className="placeholder">no data</div>}
                            </div>
                        );
                    })
                }
                </div>
*/}

                {status &&
                <div className={`status ${status.severity}`}>
                    {status.message}
                </div>}

            </div>
        </div>
    );
});
