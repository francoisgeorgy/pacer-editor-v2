import React from "react";
// import {inject, observer} from "mobx-react";

export const Download = ({data, filename, addTimestamp, disabled, className, label}) => {

    function handleClick(event) {

        const d = typeof data === 'function' ? data() : data;
        let url = window.URL.createObjectURL(new Blob([d], {type: "application/octet-stream"}));

        let filename = filename;

        if (addTimestamp) {
            let now = new Date();
            let timestamp =
                now.getUTCFullYear() + "-" +
                ("0" + (now.getUTCMonth() + 1)).slice(-2) + "-" +
                ("0" + now.getUTCDate()).slice(-2) + "-" +
                ("0" + now.getUTCHours()).slice(-2) + "" +
                ("0" + now.getUTCMinutes()).slice(-2) + "" +
                ("0" + now.getUTCSeconds()).slice(-2);
            filename += '.' + timestamp;
        }

        let shadowlink = document.createElement("a");
        shadowlink.download = filename + ".syx";
        shadowlink.style.display = "none";
        shadowlink.href = url;

        document.body.appendChild(shadowlink);
        shadowlink.click();
        document.body.removeChild(shadowlink);

        setTimeout(function() {
            return window.URL.revokeObjectURL(url);
        }, 1000);

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
