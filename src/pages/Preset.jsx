import React, {useState} from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import {CONTROLS_DATA} from "../pacer/sysex";
import {ControlSelector} from "../components/ControlSelector";
import {CONTROLS_FULLNAME, TARGET_PRESET} from "../pacer/constants";
import {setAutoFreeze} from "immer";
import {ControlStepsEditor} from "../components/ControlStepsEditor";
import {ControlModeEditor} from "../components/ControlModeEditor";
import {PresetNameEditor} from "../components/PresetNameEditor";
import {isVal} from "../utils/misc";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import {presetIndexToXY} from "../pacer/utils";
import {PresetOverview} from "../components/PresetsOverview";
import ReactSwitch from "../components/switch";
import "./Preset.css";
import {Tabs} from "../components/Tabs";
// var clone = require('clone');

//FIXME: fix this:
setAutoFreeze(false);   // needed to be able to update name and copy a preset at the same time. Otherwise immerjs freez the state in updateMessageName() and it is no longer possible to copy a preset.

export const Preset = observer(() => {

    // const [copyPresetFrom, setCopyPresetFrom] = useState("-1");
    const [copyFrom, setCopyFrom] = useState(-1);

    /**
     * dataIndex is only used when dataType == "data"
     */
    function updateControlMode(controlId, value) {
        stores.state.setControlMode(parseInt(value, 10))
    }

    function doCopyPresetFrom(presetIdFrom, presetIdTo) {
        if (presetIdFrom < 0 || presetIdTo < 0) return false;
        stores.state.copyFromTo(presetIdFrom, presetIdTo);
    }

    const presetIndex = stores.state.currentPresetIndex;
    const controlId = stores.state.currentControl;  // ? stores.state.currentControl : 1;
    const data = stores.state.data;

    const showEditor =
        isVal(presetIndex) &&
        data &&
        (TARGET_PRESET in data) &&
        (presetIndex in data[TARGET_PRESET]) &&
        (CONTROLS_DATA in data[TARGET_PRESET][presetIndex]) &&
        (controlId in data[TARGET_PRESET][presetIndex][CONTROLS_DATA]) &&
        ("steps" in data[TARGET_PRESET][presetIndex][CONTROLS_DATA][controlId]) &&
        (Object.keys(data[TARGET_PRESET][presetIndex][CONTROLS_DATA][controlId]["steps"]).length === 6);

    return (

        <div className="content preset-editor">

            <Tabs />

            <PresetSelectorAndButtons showClearButton={false} title="Presets configuration" subtitle="Select the preset to configure." />
            {data?.[TARGET_PRESET]?.[presetIndex] &&
            <div className="content-row-content">
                <div className="preset-title-row">
                    <div className="preset-name">
                        {presetIndexToXY(presetIndex)}<span className="bullet">•</span><span className="bold">{data[TARGET_PRESET][presetIndex]["name"]}</span>
                    </div>
                    <div className="row align-center">
                        <button onClick={() => stores.state.clearPreset(presetIndex)}>Clear</button>
                        <button className="ml-20" onClick={() => doCopyPresetFrom(copyFrom, presetIndex)}>Copy from:</button> <select
                            onChange={e => setCopyFrom(parseInt(e.target.value))}>
                            <option value="-1">-</option>
                            {
                                Array.from(Array(24).keys()).map(
                                    i => {
                                        let index = i+1;
                                        let hasData = data && data[TARGET_PRESET] && data[TARGET_PRESET][index];
                                        let name = hasData ? data[TARGET_PRESET][index]["name"] : "";
                                        return <option key={i} value={i+1}>{presetIndexToXY(i+1)} {name}</option>
                                    })
                            }
                    </select>
                    </div>
                </div>
                <PresetNameEditor />
            </div>}

            {data && data[TARGET_PRESET]?.[presetIndex] &&
            <div className="row align-center">
                <div className="edit-section-title">Controls:</div>
                <ReactSwitch onChange={(checked) => stores.state.setDetailView(checked)}
                             checked={stores.state.detailView}
                             width={48} height={20} className="ml-30 mr-10" />
                show details
            </div>}

            {data && data[TARGET_PRESET]?.[presetIndex] &&
            <div className="content-row-content">

                {stores.state.detailView &&
                <div className="detail-view">
                    <PresetOverview key={presetIndex} index={presetIndex} data={data[TARGET_PRESET][presetIndex]}
                                    title={false} hexDisplay={false} extControls={true} midi={false} />
                </div>}

                {!stores.state.detailView && isVal(presetIndex) && <ControlSelector />}

                {showEditor && <div className="edit-section-title control-name border-b">
                    {CONTROLS_FULLNAME[controlId]}:
                </div>}

                {showEditor &&
                <ControlModeEditor
                    mode={data[TARGET_PRESET][presetIndex][CONTROLS_DATA][controlId]["control_mode"]}
                    onUpdate={(value) => updateControlMode(controlId, value)}/>}

                {showEditor &&
                <ControlStepsEditor presetIndex={presetIndex} controlId={controlId} />}

                {!showEditor &&
                <div className="mt-10 mb10">
                    Select a control above to edit its configuration.
                </div>}

                {!isVal(presetIndex) && <div className="please">Select a preset.</div>}

            </div>}

            {stores.state.changed && stores.midi.outputInUse &&         // FIXME: midiConnected(output) &&
            <div className="content-row-content mt-20 menu-buttons">
                <button className="action-button update" onClick={() => stores.state.updatePacer()}>Update Pacer</button>
            </div>}

        </div>
    );

});
