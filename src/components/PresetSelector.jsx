import React, {Fragment} from "react";
import {observer} from "mobx-react-lite";
import {presetXYToIndex} from "../pacer/utils";
import {TARGET_PRESET} from "../pacer/constants";
import {stores} from "../stores";
import ReactSwitch from "./switch";
import "./PresetSelector.css";

// TODO: is observer needed here?
const Selector = observer(({ xyId, presetIndex, hasData, name, onClick }) => {

    let c = "selector";
    const selected = presetIndex === stores.state.currentPresetIndex;
    if (selected) c += " selected";
    if (hasData) c += " loaded";

    if (xyId === "CURRENT" && name) {
        return (<div className={c} onClick={() => onClick(presetIndex)}>
            CUR: {name}
        </div>);
    } else {
        return (<div className={c} onClick={() => onClick(presetIndex)}>
            <span className="preset-id">{xyId}</span> <span className="preset-name">{name}</span>
        </div>);
    }

});

export const PresetSelector = observer(() => {

    function selectPreset(index) {     // index must be a string
        stores.state.selectPreset(index);
        const data = stores.state.data;
        if (index === "24") {
            // console.log("D6 loaded?", data && data[TARGET_PRESET] && data[TARGET_PRESET][index]);
            if (!(data && data[TARGET_PRESET] && data[TARGET_PRESET][index])) {
                stores.state.showD6Info();
                return;
            }
        }
        if (!(!stores.state.forceReread && data && data[TARGET_PRESET] && data[TARGET_PRESET][index])) {
            stores.midi.readPreset(index, "reading Pacer...");
        }
    }

    function clearSelection() {
        stores.state.clearPresetSelection();
    }

    const {data} = stores.state;
    let curHasData = data && data[TARGET_PRESET] && data[TARGET_PRESET][0];
    let currName = curHasData ? data[TARGET_PRESET][0]["name"] : "";

    return (
        <div>
            <div className="selectors">
                <div className="preset-selectors">

                    <Selector xyId={"CURRENT"} presetIndex={"0"} name={currName}
                              hasData={data && data[TARGET_PRESET] && data[TARGET_PRESET][0]}
                              onClick={selectPreset} key={0}/>
                    <div/>
                    <div/>
                    <div className="force-read row align-center">
                        <ReactSwitch onChange={(checked) => stores.state.toggleForceReread(checked)}
                                     checked={stores.state.forceReread}
                                     width={48} height={20} className="mr-10 align-self-center" />
                        <span title="Always read the preset from the Pacer and refresh the editor memory. Use this if you update presets in the Pacer while using the editor.">
                            Always read from Pacer
                        </span>
                    </div>
                    {
                        ['A', 'B', 'C', 'D'].map(
                            letter =>
                                <Fragment key={letter}>
                                {
                                    Array.from(Array(6).keys()).map(
                                        digit => {
                                            let xyId = letter + (digit + 1);
                                            let index = presetXYToIndex(xyId);
                                            let hasData = data && data[TARGET_PRESET] && data[TARGET_PRESET][index];
                                            let name = hasData ? data[TARGET_PRESET][index]["name"] : "";
                                            return <Selector xyId={xyId} presetIndex={index} hasData={hasData} name={name} key={index} onClick={selectPreset} />
                                        })
                                }
                                </Fragment>
                        )
                    }
                </div>
            </div>
        </div>
    )
    // }
});

// export default inject('state')(observer(PresetSelector));
