import React, {Component} from "react";
import {observer} from "mobx-react-lite";
import {Download} from "./Download";
import {stores} from "../stores";

// class DownloadAllPresets extends Component {
export const DownloadAllPresets = observer(() => {

    // render() {
        // console.log("DownloadAllPresets render");
        if (stores.state.isBytesPresetEmpty()) return null;
        return (
            <Download data={() => stores.state.getBytesPresetsAsBlob()} filename={`pacer-patch`} addTimestamp={true} label="Save to file" />
        );
    // }

});

// export default inject('state')(observer(DownloadAllPresets));
