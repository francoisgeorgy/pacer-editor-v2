import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import {TARGET_PRESET} from "../pacer/constants";

export const PresetNameEditor = observer(() => {

    function onNameUpdate(event) {
        stores.state.updatePresetName(stores.state.currentPresetIndex, event.target.value.length > 5 ? event.target.value.substr(0, 5) : event.target.value);
    }

    const presetIndex = stores.state.currentPresetIndex;

    // console.log("PresetNameEditor render", presetIndex, stores.state.data[TARGET_PRESET][presetIndex]);

    const name= stores.state.data[TARGET_PRESET][presetIndex]["name"];

    return (
        <div className="preset-name-editor">
            <div className="edit-section-title">Name:</div>
            <input value={name} onChange={onNameUpdate} size={8} />
            max 5 characters
        </div>
    );

});

// export default inject('state')(observer(PresetNameEditor));
