import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import {TARGET_PRESET} from "../pacer/constants";
import {MidiSettingsEditor} from "../components/MidiSettingsEditor";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import {presetIndexToXY} from "../pacer/utils";
import "./Preset.css";

export const PresetMidi = observer(() => {

    const presetIndex = stores.state.currentPresetIndex;
    const data = stores.state.data;

    let showEditor = false;
    if (stores.state.data) {
        showEditor = (TARGET_PRESET in data) &&
                     (presetIndex in data[TARGET_PRESET]) &&
                     ("midi" in data[TARGET_PRESET][presetIndex]) &&
                     (Object.keys(data[TARGET_PRESET][presetIndex]["midi"]).length === 16)
    }

    return (
        <div className="content">

            <PresetSelectorAndButtons showClearButton={false} title="Preset recall MIDI Configuration" subtitle="Select the preset to configure:" />

            {showEditor &&
            <div className="content-row-content">
                <h3 className="preset-title">
                    {presetIndexToXY(presetIndex)}<span className="bullet">•</span><span className="bold"> {data[TARGET_PRESET][presetIndex]["name"]}</span>
                </h3>
                {/*<h2>Preset MIDI settings</h2>*/}
                <div className="mt-20 mb-20">
                    You can define up to 16 MIDI messages or relay switches that will be activated instantly when the preset is recalled.
                </div>
            </div>}

            {showEditor && <MidiSettingsEditor />}

            {stores.state.changed && stores.midi.outputInUse &&         // FIXME: midiConnected(output) &&
            <div className="content-row-content mt-20 menu-buttons">
                {/*<h2>Send the updated config to the Pacer</h2>*/}
                <button className="action-button update" onClick={() => stores.state.updatePacer()}>Update Pacer</button>
            </div>}

        </div>
    );

});
