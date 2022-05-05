import React, {Component} from "react";
import {observer} from "mobx-react-lite";
import {stores} from "../stores";

export const BusyIndicator = observer(({msg, className}) => {

    const { busy, busyMessage, progress, abortButton } = stores.state;
    return busy ?
        <div className={className || 'busy'}>
            {msg ? msg : busyMessage}
            {progress >= 0 && <div className="center">{progress}%</div>}
            {abortButton && <div>
                <button onClick={() => stores.midi.abortSend()}>abort</button>
            </div>}
        </div>
        : null;

});
