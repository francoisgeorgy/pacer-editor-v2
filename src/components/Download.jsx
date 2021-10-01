import React from "react";
import {getTimestamp} from "../utils/misc";
// import {inject, observer} from "mobx-react";

export const Download = ({data, filename, addTimestamp, disabled, className, label}) => {

    function handleClick(event) {

        // const d = typeof data === 'function' ? data() : data;
        // let url = window.URL.createObjectURL(new Blob([d], {type: "application/octet-stream"}));

        let fname = filename;

        if (addTimestamp) {
            fname += '.' + getTimestamp();
        }

        saveAs(new Blob([Uint8Array.from(typeof data === 'function' ? data() : data)], {type: "application/octet-stream"}), fname);

        // let shadowlink = document.createElement("a");
        // shadowlink.download = fname + ".syx";
        // shadowlink.style.display = "none";
        // shadowlink.href = url;
        //
        // document.body.appendChild(shadowlink);
        // shadowlink.click();
        // document.body.removeChild(shadowlink);
        //
        // setTimeout(function() {
        //     return window.URL.revokeObjectURL(url);
        // }, 1000);

    }

    // render() {
        if (disabled) {
            return (
                <button disabled={true} className={`action-button ${className}`}>{label}</button>
            );
        } else {
            return (
                <button onClick={handleClick} className={`action-button ${className}`}>{label}</button>
            );
        }
    // }

}

// export default inject('state')(observer(Download));
