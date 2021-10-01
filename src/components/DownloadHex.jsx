import React from "react";
import { saveAs } from 'file-saver';
import {hs, toHexDump} from "../utils/hexstring";
import {getTimestamp} from "../utils/misc";

export const DownloadHex = ({data, filename, addTimestamp, className, label}) => {

    function handleClick(event) {

        const d = typeof data === 'function' ? data() : data;

        // data must be an array of array of numbers

        let text = '';
        d.forEach(msg => text += hs(msg) + "\n");

        let fname = filename;
        if (addTimestamp) {
            fname += '.' + getTimestamp();
        }

        saveAs(new Blob([text], {type: "text/plain;charset=utf-8"}), fname + ".hex");
    }

    return (
        <button onClick={handleClick} className={`action-button ${className}`}>{label}</button>
    );

}
