import './index.css';       // first position because it contains un @charset directive.
import React from 'react'
import ReactDOM from 'react-dom'
import {App} from './App'
import {registerSW} from 'virtual:pwa-register'

function noop() {}
if (import.meta.env.PROD) {
    console.log = noop;
    console.warn = noop;
    console.error = noop;
}

const updateSW = registerSW({
    onOfflineReady() {
        console.log("READY FOR OFFLINE USAGE");
    },
});

ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
)
