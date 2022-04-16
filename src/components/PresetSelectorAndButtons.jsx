import {observer} from "mobx-react-lite";
import React from "react";
import {stores} from "../stores";
import {PresetSelector} from "./PresetSelector";
import {OverviewPresetSelector} from "./OverviewPresetSelector";
import {BusyIndicator} from "./BusyIndicator";

export const PresetSelectorAndButtons = observer(({overview, showClearButton, title, subtitle}) => {
    return (
        <div className="content-row-content first xmb-20">
            {/*<h2>{title || 'Presets'}</h2>*/}
            {subtitle && <div className="mb-10 subtitle">{subtitle}</div>}
            <div className="row align-bottom">
                <div>
                    <div className="row align-bottom">
                        {overview && <OverviewPresetSelector showClearButton={showClearButton} />}
                        {!overview && <PresetSelector showClearButton={showClearButton} />}
                        {/*<ActionButtons />*/}
                        <div className="mt-40">
                            <BusyIndicator />
                        </div>
                    </div>
                    {stores.state.D6InfoVisible &&
                    <div className="d6info">
                        Please, click the "Read Pacer" button to get the D6 preset data.
                        <div className="dismiss" onClick={() => stores.state.hideD6Info()}>[hide]</div>
                    </div>}
                </div>
            </div>
        </div>
    );
});
