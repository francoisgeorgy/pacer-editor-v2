import React from "react";
import { saveAs } from 'file-saver';
import {hs, toHexDump} from "../utils/hexstring";

export const DownloadHex = ({data, filename, addTimestamp, className, label}) => {

    function handleClick(event) {

        const d = typeof data === 'function' ? data() : data;

        // data must be an array of array of numbers

        console.log("DownloadHex", d);

        let text = '';
        d.forEach(msg => text += hs(msg) + "\n");
        // d.forEach(msg => text += toHexDump(msg, 8, false) + "\n");

        let fname = filename;
        if (addTimestamp) {
            let now = new Date();
            let timestamp =
                now.getUTCFullYear() + "-" +
                ("0" + (now.getUTCMonth() + 1)).slice(-2) + "-" +
                ("0" + now.getUTCDate()).slice(-2) + "-" +
                ("0" + now.getUTCHours()).slice(-2) + "" +
                ("0" + now.getUTCMinutes()).slice(-2) + "" +
                ("0" + now.getUTCSeconds()).slice(-2);
            fname += '.' + timestamp;
        }

        saveAs(new Blob([text], {type: "text/plain;charset=utf-8"}), fname + ".hex");
    }

    return (
        <button onClick={handleClick} className={className}>{label}</button>
    );

}
