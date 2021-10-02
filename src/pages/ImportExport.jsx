import React, {useRef, useState} from 'react';
import {stores} from "../stores";
import {observer} from "mobx-react-lite";
import {getFullNonGlobalConfigSysex} from "../pacer/sysex";
import {DownloadHex} from "../components/DownloadHex";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import {DownloadBin} from "../components/DownloadBin";
import "./ImportExport.css";

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

    function sendToPacer() {
        stores.midi.sendToPacer();
    }

    const data = stores.state.data;

    return (
        <div className="content">

            <div className="mb-20">
                <PresetSelectorAndButtons showClearButton={true} overview={true}
                                          title="Import/Export presets"
                                          subtitle="Select the presets to export or send:" />
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
                    <h3>Export to file:</h3>
                </div>
                <div className="mt-10">
                    {/*<DownloadAllPresets />*/}
                    <DownloadBin data={() => getFullNonGlobalConfigSysex(data, true, true)} filename={`pacer-patch`} addTimestamp={true} label="Export"/>
                    <span className="light">{stores.state.allSelected() ? 'all presets' : stores.state.noneSelected() ? '' : `presets ${stores.state.getOverviewSelectionInfo()}`}</span>
                    {/*<DownloadBin data={() => getFullNonGlobalConfigSysex(data, false, true)} filename={`pacer-patch`} addTimestamp={true} label="Export all"/>*/}
                    {/*<DownloadHex data={() => getFullNonGlobalConfigSysex(data, true, true)} filename={`pacer-patch`} addTimestamp={true} label="Export HEX (debug)"/>*/}
                    {/*<BusyIndicator className="space-left inline-busy" busyMessage={"reading pacer:"} />*/}
                    <div>
                        <p>You will get a file containing sysex messages, in binary format.</p>
                        <p>This file can be use with this editor but also with any application able to send SysEx data from a file,
                            like <a href="https://www.snoize.com/sysexlibrarian/" target="_blank" rel="noopener">Sysex Librarian</a> or <a href="https://www.bome.com/products/sendsx" target="_blank" rel="noopener">Send SX</a>.</p>
                    </div>
                </div>

                <div className="mt-20">
                    <h3>Import from file:</h3>
                </div>
                <div className="mt-10">
                    <input ref={inputOpenFileRef} type="file" style={{display:"none"}} onChange={onChangeFile} />
                    <div className="row align-center">
                        <button className="action-button" onClick={onInputFile}>Load file</button>
                        {/*<Switch onChange={(checked) => console.log(checked)} checked={false} width={48} height={20} className="mr-10 align-self-center" /> Clear the editor's data before importing.*/}
                    </div>
                    <div>
                        <p>The file must contain sysex messages, in binary format.</p>
                        <p>You can create such a file with this editor but also with any application able
                            to save SysEx data into a file,
                            like <a href="https://www.snoize.com/sysexlibrarian/" target="_blank" rel="noopener">Sysex Librarian</a> or <a href="https://www.bome.com/products/sendsx" target="_blank" rel="noopener">Send SX</a>.</p>
                    </div>
                </div>

                <div className="mt-20">
                    <h3>Send to Pacer:</h3>
                </div>
                <div className="mt-10">
                    <div className="row align-center">
                        <button className={`action-button ${stores.midi.deviceConnected ? "" : "disabled"}`} onClick={sendToPacer}>Send</button>
                        <span className="light">{stores.state.allSelected() ? 'all presets' : stores.state.noneSelected() ? '' : `presets ${stores.state.getOverviewSelectionInfo()}`}</span>
                        {stores.state.sendProgress && <span>{stores.state.sendProgress}</span>}
                    </div>
                    <div>
                        <p>This will send the selected presets to the Pacer.</p>
                    </div>
                </div>
{/*
                    {data && stores.midi.deviceConnected && <button className="action-button" onClick={sendDump}>Send to Pacer</button>}
*/}

                {status &&
                <div className={`status ${status.severity}`}>
                    {status.message}
                </div>}

            </div>
        </div>
    );
});
