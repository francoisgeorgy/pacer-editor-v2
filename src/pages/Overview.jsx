import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import PresetsOverview from "../components/PresetsOverview";
import "./Overview.css";
import {Tabs} from "../components/Tabs";

export const Overview = observer(() => {

    return (
        <div className="content">

            <Tabs />

            <div className="mb-20">
                <PresetSelectorAndButtons showClearButton={true} overview={true}
                    title="Presets Overview" subtitle="Select the presets to view or select none to view all presets:" />
            </div>
            <div className="content-row-content">
                <PresetsOverview data={stores.state.data}
                                 hexDisplay={!stores.state.decBase}
                                 extControls={stores.state.extControls}
                                 currentPreset={stores.state.currentPresetIndex}/>
            </div>
        </div>
    );

});
