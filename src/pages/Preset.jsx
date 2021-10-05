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

//FIXME: fix this:
setAutoFreeze(false);   // needed to be able to update name and copy a preset at the same time. Otherwise immerjs freez the state in updateMessageName() and it is no longer possible to copy a preset.

export const Preset = observer(() => {

    const [copyPresetFrom, setCopyPresetFrom] = useState("-1");

    /**
     * dataIndex is only used when dataType == "data"
     */
    function updateControlMode(controlId, value) {
        stores.state.setControlMode(parseInt(value, 10))
    }

    function doCopyPresetFrom(presetIdFrom, presetIdTo) {
        //FIXME: use immerjs
/*
        const { data, updateMessages } = this.state;

        if (data && data[TARGET_PRESET][presetIdFrom]) {

            if (!data[TARGET_PRESET][presetIdTo]) data[TARGET_PRESET][presetIdTo] = {};
            data[TARGET_PRESET][presetIdTo]["changed"] = true;

            if (!updateMessages.hasOwnProperty(presetIdTo)) updateMessages[presetIdTo] = {};
            if (!updateMessages[presetIdTo].hasOwnProperty(CONTROLS_DATA)) updateMessages[presetIdTo][CONTROLS_DATA] = {};

            //
            // Only copy CONTROLS (for the current version)
            //
            //FIXME: copy EXP and FS config
            CONTROLS_WITH_SEQUENCE.forEach(controlId => {
                // data[TARGET_PRESET][presetIdTo][CONTROLS_DATA][controlId] = Object.assign({}, data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA][controlId]);
                // ugly / deep copy without shallow references:
                data[TARGET_PRESET][presetIdTo][CONTROLS_DATA][controlId] = JSON.parse(JSON.stringify(data[TARGET_PRESET][presetIdFrom][CONTROLS_DATA][controlId]));
                updateMessages[presetIdTo][CONTROLS_DATA][controlId] = getControlUpdateSysexMessages(presetIdTo, controlId, data, true);
            });
            // Object.assign(data[TARGET_PRESET][presetIdTo], data[TARGET_PRESET][presetIdFrom]);

            //we do not copy the name
            //updateMessages[presetIdTo]["name"] = buildPresetNameSysex(presetIdTo, data);

            // CONTROLS_WITH_SEQUENCE.forEach(controlId => updateMessages[presetIdTo][CONTROLS_DATA][controlId] = getControlUpdateSysexMessages(presetIdTo, controlId, data, true));

            this.setState({data, updateMessages, changed: true});
        }
*/
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

/*
        let presetLabel = "";
        if (data &&
            (TARGET_PRESET in data) &&
            (presetIndex in data[TARGET_PRESET]) &&
            ("name" in data[TARGET_PRESET][presetIndex])) {
            presetLabel = presetIndexToXY(presetIndex) + ": " + data[TARGET_PRESET][presetIndex]["name"];
        }
*/
    // const showControls = isVal(presetIndex);

    return (

        <div className="content preset-editor">

            <PresetSelectorAndButtons showClearButton={false} title="Presets configuration" subtitle="Select the preset to configure:" />

            {/*<LoadFactoryDefaultsButton />*/}

            {data?.[TARGET_PRESET]?.[presetIndex] &&
            <div className="content-row-content">
                {/*<h2>Preset {presetLabel}</h2>*/}
                <h3 className="preset-title">
                    {presetIndexToXY(presetIndex)}<span className="bullet">•</span><span className="bold"> {data[TARGET_PRESET][presetIndex]["name"]}</span>
                </h3>
                <PresetNameEditor />
            </div>}

            {data && data[TARGET_PRESET]?.[presetIndex] &&
            <div className="row align-center mt-20">
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

{/*
                    {data && presetIndex in data[TARGET_PRESET] && Object.keys(data[TARGET_PRESET]).length > 1 &&
                    <Fragment>
                        (experimental) <button onClick={() => this.copyPresetFrom(this.stores.state.copyPresetFrom, presetIndex)}>copy</button> from preset <select value={this.stores.state.copyPresetFrom} onChange={(event) => this.setState({copyPresetFrom: event.target.value})}>
                            <option value="">-</option>
                        {
                            Object.keys(data[TARGET_PRESET]).map((key, index) => {
                                if (data[TARGET_PRESET][key]) {
                                    return (<option key={index} value={key}>{presetIndexToXY(key)} {data[TARGET_PRESET][key].name}</option>);
                                } else {
                                    return null;
                                }
                            })
                        }
                        </select> <span className="small">(copy the configuration for the footswitches A..D and 1..6 only)</span>
                    </Fragment>
                    }
*/}

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
