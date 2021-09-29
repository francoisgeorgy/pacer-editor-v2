import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "./stores";
import {HashRouter as Router, Route, Link, Switch} from "react-router-dom";
import {Home} from "./pages/Home";
import {Preset} from "./pages/Preset";
import {Footer} from "./components/Footer";
import {PresetMidi} from "./pages/PresetMidi";
import {Overview} from "./pages/Overview";
import {ANY_MIDI_PORT, PACER_MIDI_PORT_NAME} from "./pacer/constants";
import {BusyIndicator} from "./components/BusyIndicator";
import * as QueryString from "query-string";
import {Patch} from "./pages/Patch";
import {MenuButtons} from "./components/MenuButtons";
import {MidiPortsSelect} from "./midi/MidiPortsSelect";
import './App.css';
import {MidiSupportWarning} from "./midi/MidiSupportWarning";

const MenuLink = ({ label, to, activeOnlyWhenExact }) => (
    <Route
        path={to}
        exact={activeOnlyWhenExact}
        children={({ match }) => (
            <div className={match ? "header-link active" : "header-link"}>
                <Link to={to}>{label}</Link>
            </div>
        )}
    />
);

const NoMatch = () =>
    <div className="content home">
        <div className="error">
            Invalid URL
        </div>
    </div>;


// class App extends Component {
export const App = observer((props) => {

    // render() {
    //     return (
    //         <div className="app">
    //             PACER EDITOR
    //         </div>
    //     );
    // }

    // render() {

        const q =  QueryString.parse(window.location.search);
        const debug = q.debug ? q.debug === '1' : false;

        return (
            // <Provider state={globalState}>
                <Router>
                    <div className="app">

                        <MidiSupportWarning />

                        <header className="header">
                            <MenuLink activeOnlyWhenExact={true} to="/" label="Overview" />
                            <MenuLink to="/preset"          label="Preset Controls" />
                            <MenuLink to="/presetmidi"      label="Preset MIDI" />
                            <MenuLink to="/patch"           label="Import/Export" />
                            {/*{debug && <MenuLink to="/dumpdecoder" label="Dump decoder" />}*/}
                            {/*{debug && <MenuLink to="/debug" label="Debug" />}*/}
                            <MenuLink to="/help"            label="Help" />
                            <div className="spacer"> </div>
                            <div className="header-app-name">
                                Pacer editor by <a href="https://studiocode.dev/" target="_blank" rel="noopener noreferrer">StudioCode.dev</a>
                            </div>
                        </header>

                        <div className="subheader row align-center">
                            {/*<Midi only={ANY_MIDI_PORT} autoConnect={PACER_MIDI_PORT_NAME} />*/}
                            <MidiPortsSelect />
                            <BusyIndicator />
                            <div className="grow right-align text-large">
                                <a className="external" href="https://studiocode.dev/midi-monitor/" target="midi_monitor">MIDI Monitor</a>
                            </div>
                        </div>

                        <div className="subheader row align-center">
                            <MenuButtons />
                        </div>

                        <div className="main-content-wrapper">
                            <Switch>
                                <Route exact={true} path="/" render={(props) => <Overview debug={debug}/>} />
                                <Route path="/preset"        render={(props) => <Preset debug={debug}/>} />
                                <Route path="/presetmidi"    render={(props) => <PresetMidi debug={debug} />} />
                                <Route path="/patch"         render={(props) => <Patch debug={debug} />} />
                                {/*{debug && <Route path="/dumpdecoder" render={props => <DumpDecoder debug={debug}/>} />}*/}
                                {/*{debug && <Route path="/debug"       render={props => <Debug debug={debug} />} />}*/}
                                <Route exact={true} path="/help"     render={(props) => <Home />} />
                                <Route component={NoMatch} />
                            </Switch>
                        </div>

                        <Footer />
                    </div>
                </Router>
            // </Provider>
        );
    // }
});

// export default App;
