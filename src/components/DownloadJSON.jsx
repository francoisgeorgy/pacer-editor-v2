import React from "react";

export const DownloadJSON = ({data, filename, addTimestamp, className, label}) => {

    function handleClick(event) {

        const url = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));

        // let url = window.URL.createObjectURL(new Blob([this.props.data], {type: "application/octet-stream"}));

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

        let shadowlink = document.createElement("a");
        shadowlink.download = fname + ".json";
        shadowlink.style.display = "none";
        shadowlink.href = url;

        document.body.appendChild(shadowlink);
        shadowlink.click();
        document.body.removeChild(shadowlink);

        setTimeout(function() {
            return window.URL.revokeObjectURL(url);
        }, 1000);

    }

    return (
        <button onClick={handleClick} className={`action-button ${className}`}>{label}</button>
    );

}
