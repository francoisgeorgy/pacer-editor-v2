import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import {TARGET_PRESET} from "../pacer/constants";
import {MidiSettingsEditor} from "../components/MidiSettingsEditor";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import {presetIndexToXY} from "../pacer/utils";
import "./Preset.css";

export const PresetMidi = observer(() => {

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         // dropZoneActive: false
    //     };
    // }

/*
    onDragEnter = () => {
        this.setState({
            dropZoneActive: true
        });
    };

    onDragLeave= () => {
        this.setState({
            dropZoneActive: false
        });
    };

    onDrop = (files) => {
        // this.props.stores.state.clear();
        this.props.stores.state.changed = true;
        this.setState(
            {dropZoneActive: false},
            () => { this.props.stores.state.readFiles(files) }   // returned promise from readFiles() is ignored, this is normal.
        );
    };
*/

    // render() {

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

/*
            <Dropzone
                disableClick
                style={{position: "relative"}}
                onDrop={this.onDrop}
                onDragEnter={this.onDragEnter}
                onDragLeave={this.onDragLeave}>

                {this.stores.state.dropZoneActive &&
                <div style={dropOverlayStyle}>
                    Drop sysex file...
                </div>}
*/

                <div className="wrapper">
                    <div className="content">

                        <PresetSelectorAndButtons showClearButton={false} />

                        {/*<LoadFactoryDefaultsButton />*/}

                        {showEditor &&
                        <div className="content-row-content">
                            <h3 className="preset-title">
                                {presetIndexToXY(presetIndex)}<span className="bullet">•</span><span className="bold"> {data[TARGET_PRESET][presetIndex]["name"]}</span>
                            </h3>
                            {/*<h2>Preset MIDI settings</h2>*/}
                        </div>}

                        {showEditor && <div className="edit-section-title control-name no-border">
                            Preset Recall MIDI Configuration:
                        </div>}

                        <div className="mb-10">
                            You can define up to 16 MIDI messages or relay switches that will be activated instantly when the preset is recalled.
                        </div>

                        {showEditor && <MidiSettingsEditor />}

                        {stores.state.changed && stores.state.midi.output !== 0 &&         // FIXME: midiConnected(output) &&
                        <div className="content-row-content mt-20 menu-buttons">
                            {/*<h2>Send the updated config to the Pacer</h2>*/}
                            <button className="action-button update" onClick={() => stores.state.updatePacer()}>Update Pacer</button>
                        </div>}

                    </div>

                </div>

            // </Dropzone>

        );
    // }

});

// export default inject('state')(observer(PresetMidi));
