import React, {useRef} from 'react';
import {stores} from "../stores";
import {observer} from "mobx-react-lite";
import {getFullNonGlobalConfigSysex} from "../pacer/sysex";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import {DownloadBin} from "../components/DownloadBin";
import "./ImportExport.css";

export const ImportExport = observer(() => {

    const inputOpenFileRef = useRef(null);

    function onChangeFile(e) {
        let file = e.target.files[0];
        if (file) {
            stores.state.readFiles([file]).then(() => console.log("done reading files"));
        }
    }

    function onInputFile(e) {
        inputOpenFileRef.current.click();
    }

    function sendToPacer() {
        stores.midi.sendToPacer(getFullNonGlobalConfigSysex(this.stores.state.data, true, true)).then(r => () => console.log("done sending sysex"));
    }

    const data = stores.state.data;

    return (
        <div className="content import-export">

            <PresetSelectorAndButtons showClearButton={true} overview={true}
                                      title="Import/Export presets"
                                      subtitle="Select the presets to export or send:" />

            <div className="content-row-content first dump-wrapper">

                <div className="import-export-actions">

                    <div className="">
                        <div>
                            <div className="action-name">Import from file:</div>
                        </div>
                        <div className="mt-10">
                            <input ref={inputOpenFileRef} type="file" style={{display:"none"}} onChange={onChangeFile} />
                            <div className="row align-center">
                                <button className="action-button" onClick={onInputFile}>Load file</button>
                                {/*<Switch onChange={(checked) => console.log(checked)} checked={false} width={48} height={20} className="mr-10 align-self-center" /> Clear the editor's data before importing.*/}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div>
                            <div className="action-name">Export to file:</div>
                        </div>
                        <div className="mt-10">
                            <DownloadBin data={() => getFullNonGlobalConfigSysex(data, true, true)}
                                         filename={`pacer-patch`} addTimestamp={true}
                                         className={stores.state.someSelected() ? '' : 'disabled'} label="Export"/>
                            {/*<span className="light">{stores.state.allSelected() ? 'all presets' : stores.state.noneSelected() ? '' : `presets ${stores.state.getOverviewSelectionInfo()}`}</span>*/}
                            {/*<DownloadBin data={() => getFullNonGlobalConfigSysex(data, false, true)} filename={`pacer-patch`} addTimestamp={true} label="Export all"/>*/}
                            {/*<DownloadHex data={() => getFullNonGlobalConfigSysex(data, true, true)} filename={`pacer-patch`} addTimestamp={true} label="Export HEX (debug)"/>*/}
                            {/*<BusyIndicator className="space-left inline-busy" busyMessage={"reading pacer:"} />*/}
                        </div>
                    </div>

                    <div className="">
                        <div>
                            <div className="action-name">Send to Pacer:</div>
                        </div>
                        <div className="mt-10">
                            <div className="row align-center">
                                <button className={`action-button ${stores.midi.deviceConnected ? "" : "disabled"} ${stores.state.someSelected() ? '' : 'disabled'}`}
                                        onClick={sendToPacer}>Send</button>
                                {/*<span className="light">{stores.state.allSelected() ? 'all presets' : stores.state.noneSelected() ? '' : `presets ${stores.state.getOverviewSelectionInfo()}`}</span>*/}
                                {/*{stores.state.sendProgress && <span>{stores.state.sendProgress}</span>}*/}
                            </div>
                        </div>
                    </div>

                    {stores.midi.sendProgress &&
                    <div className="no-border">
                        <div>
                            {stores.midi.sendProgress}
                        </div>
                        <div>
                            <button onClick={() => stores.midi.abortSend()}>abort</button>
                        </div>
                    </div>}
                </div>

                <div>
                    <ul>
                        <li>The Global Config is not included.</li>
                        <li>Only the selected presets are exported or sent.</li>
                        <li>The file contains sysex data in binary format. This format is compatible with tools like <a href="https://www.snoize.com/sysexlibrarian/" target="_blank" rel="noopener">Sysex Librarian</a> or <a href="https://www.bome.com/products/sendsx" target="_blank" rel="noopener">Send SX</a>.</li>
                    </ul>
                </div>

                {/* status &&
                <div className={`status ${status.severity}`}>
                    {status.message}
                </div> */}

            </div>
        </div>
    );
});
