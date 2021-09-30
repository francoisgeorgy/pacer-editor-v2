import React from "react";
import {saveAs} from 'file-saver';
import {getTimestamp} from "../utils/misc";

export const DownloadBin = ({data, filename, addTimestamp, className, label}) => {

    function handleClick(event) {

        const d = typeof data === 'function' ? data() : data;

        let bytes = [];
        d.forEach(msg => bytes.push(...msg));

        let fname = filename;
        if (addTimestamp) {
            fname += '.' + getTimestamp();
        }
        fname += ".syx"

        saveAs(new Blob([Uint8Array.from(bytes)], {type: "application/octet-stream"}), fname);
    }

    return (
        <button onClick={handleClick} className={className}>{label}</button>
    );

}
