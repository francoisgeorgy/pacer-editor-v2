import React, {Component} from "react";
import {observer} from "mobx-react-lite";
import {stores} from "../stores";

export const BusyIndicator = observer(({msg, className}) => {

    const { busy, busyMessage, progress } = stores.state;
    return busy ?
        <div className={className || 'busy'}>
            {msg ? msg : busyMessage}
            {progress >= 0 && <span> {progress}%</span>}
        </div>
        : null;

});
