import React from "react";
import {CONTROL_MODES} from "../pacer/constants";
import"./ControlModeEditor.css";

export const ControlModeEditor = ({mode, onUpdate}) => {
    return (
        <div className="control-mode">
            <span className="step-row-header">Control mode:</span>
            <select onChange={(event) => onUpdate(event.target.value)} value={mode}>
                {Object.keys(CONTROL_MODES).map(key => <option key={key} value={key}>{CONTROL_MODES[key]}</option>)}
            </select>
        </div>
    );
};

// export default ControlModeEditor;
