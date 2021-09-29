import React, {Component} from "react";
import {FOOTSWITCHES, STOMPSWITCHES_TOP, STOMPSWITCHES_BOTTOM, EXPPEDALS, CONTROLS} from "../pacer/constants";
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
import "./ControlSelector.css";

const Control = ({ name, controlIndex, selected, onSelect }) => {
    // console.log("Control", name, controlIndex, typeof name, typeof controlIndex);
    return (
        <div className={selected ? "selector selected" : "selector"} onClick={() => onSelect(controlIndex)}>
            <div className="name">{name}</div>
        </div>
    );
}


export const ControlSelector = observer(() => {

    function selectControl(controlId) {
        stores.state.selectControl(controlId);
    }

    // render() {
        const c = stores.state.currentControl;
        return (
            <div className="controls blue-selectors">
                {FOOTSWITCHES.map(key => <Control key={key} name={CONTROLS[key]} controlIndex={key} selected={key === c} onSelect={selectControl} />)}
                {EXPPEDALS.map(key => <Control key={key} name={CONTROLS[key]} controlIndex={key} selected={key === c} onSelect={selectControl} />)}
                <div className="no-control">&nbsp;</div>
                {STOMPSWITCHES_TOP.map(key => <Control key={key} name={CONTROLS[key]} controlIndex={key} selected={key === c} onSelect={selectControl} />)}
                <div className="no-control">&nbsp;</div>
                {STOMPSWITCHES_BOTTOM.map(key => <Control key={key} name={CONTROLS[key]} controlIndex={key} selected={key === c} onSelect={selectControl} />)}
            </div>
        );
    // }
});

// export default inject('state')(observer(ControlSelector));
