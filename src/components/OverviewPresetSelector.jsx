import React, {Component, Fragment} from "react";
import {observer} from "mobx-react-lite";
import {presetXYToIndex} from "../pacer/utils";
import {TARGET_PRESET} from "../pacer/constants";
import {stores} from "../stores";
import Switch from "react-switch";
import "./PresetSelector.css";

// TODO: is observer needed here?
const Selector = observer(({ xyId, presetIndex, hasData, name, onClick }) => {

    // console.log("OverviewPresetSelector.Selector");

    // console.log("Selector", xyId, presetIndex, stores.state.currentPreset, typeof presetIndex, typeof stores.state.currentPreset);

    let c = "selector";
    // const selected = presetIndex === stores.state.currentPresetIndex;
    const selected = stores.state.overviewSelection.includes(presetIndex);
    if (selected) c += " selected";
    if (hasData) c += " loaded";
    // if (!selected && hasData) c += " loaded";

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

export const OverviewPresetSelector = observer(() => {

    function selectPreset(index) {     // index must be a string
        stores.state.togglePresetOverviewSelection(index);
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

    // console.log("OverviewPresetSelector.OverviewPresetSelector");

    const {data, currentPresetIndex} = stores.state;
    // console.log("PresetSelector render", currentPreset, typeof currentPreset);

    let curHasData = data && data[TARGET_PRESET] && data[TARGET_PRESET][0];

    let currName = curHasData ? data[TARGET_PRESET][0]["name"] : "";

    return (
        <div>
        <div className="selectors">
            <div className="preset-selectors">

                <Selector xyId={"CURRENT"} presetIndex={"0"} hasData={data && data[TARGET_PRESET] && data[TARGET_PRESET][0]} name={currName}
                          xselected={!!currentPresetIndex} onClick={selectPreset} key={0} />
{/*
                <div className="clear-selection">
                    {this.props.showClearButton && currentPresetIndex && <button onClick={this.clearSelection}>clear selection</button>}
                </div>
*/}
                <div className="span-2">
                    <button className={`ml-20 button-as-link ${stores.state.noneSelected() ? 'dimmed' : ''}`} onClick={clearSelection}>select none</button>
                    <button className={`button-as-link ${stores.state.allSelected() ? 'dimmed' : ''}`} onClick={() => stores.state.selectAllPresets()}>select all</button>
                </div>

                {/*<div></div>*/}

                <div className="force-read row align-center">
                    {/*<label>*/}
                        {/*<input type="checkbox" checked={stores.state.forceReread} onChange={stores.state.toggleForceReread} />*/}
                        <Switch onChange={(checked) => stores.state.toggleForceReread(checked)} checked={stores.state.forceReread} width={48} height={20}
                                className="mr-10 align-self-center" />
                        Always read from Pacer
                    {/*</label>*/}
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
    );
});
