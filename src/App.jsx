import React from 'react';
import {observer} from "mobx-react-lite";
import {HashRouter as Router, Route, Link, Switch} from "react-router-dom";
import {Home} from "./pages/Home";
import {Preset} from "./pages/Preset";
import {Footer} from "./components/Footer";
import {PresetMidi} from "./pages/PresetMidi";
import {Overview} from "./pages/Overview";
import {BusyIndicator} from "./components/BusyIndicator";
import {ImportExport} from "./pages/ImportExport";
import {MenuButtons} from "./components/MenuButtons";
import {MidiSupportWarning} from "./midi/MidiSupportWarning";
import {MidiPortsSelect} from "./midi/MidiPortsSelect";
import * as QueryString from "query-string";
import './App.css';
import {UpdateMessages} from "./components/UpdateMessages";
import UpdateMessagesBytes from "./components/UpdateMessagesBytes";
import {stores} from "./stores";
import {TARGET_PRESET} from "./pacer/constants";
import {CONTROLS_DATA} from "./pacer/sysex";

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
                            <MenuLink to="/preset"          label="Preset config" />
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
                            <MidiPortsSelect />
                            <BusyIndicator />
                            <div className="grow right-align text-large">
                                <a className="external" href="https://studiocode.dev/midi-monitor/" target="midi_monitor">MIDI Monitor</a>
                            </div>
                        </div>

                        <div className="subheader row align-center">
                            <MenuButtons />
                            <div className="grow right-align text-large">
                                <a className="external" href="https://studiocode.dev/resources/midi-cc/" target="midi_cc">MIDI CC cheat sheet</a>
                            </div>
                        </div>

                        <div className="main-content-wrapper">
                            <Switch>
                                <Route exact={true} path="/" render={(props) => <Overview debug={debug}/>} />
                                <Route path="/preset"        render={(props) => <Preset debug={debug}/>} />
                                <Route path="/presetmidi"    render={(props) => <PresetMidi debug={debug} />} />
                                <Route path="/patch"         render={(props) => <ImportExport debug={debug} />} />
                                {/*{debug && <Route path="/dumpdecoder" render={props => <DumpDecoder debug={debug}/>} />}*/}
                                {/*{debug && <Route path="/debug"       render={props => <Debug debug={debug} />} />}*/}
                                <Route exact={true} path="/help"     render={(props) => <Home />} />
                                <Route component={NoMatch} />
                            </Switch>
                        </div>

                        <UpdateMessages />

                        <div className="row">
                            <div>1.13:
                            {stores.state.data &&
                                stores.state.data[TARGET_PRESET] &&
                                stores.state.data[TARGET_PRESET]["1"] &&
                                stores.state.data[TARGET_PRESET]["1"][CONTROLS_DATA] &&
                                stores.state.data[TARGET_PRESET]["1"][CONTROLS_DATA]["13"] &&
                                <pre>{JSON.stringify(stores.state.data[TARGET_PRESET]["1"][CONTROLS_DATA]["13"], null, 4)}</pre>
                            }
                            </div>
                            <div>1.24:
                            {stores.state.data &&
                                stores.state.data[TARGET_PRESET] &&
                                stores.state.data[TARGET_PRESET]["1"] &&
                                stores.state.data[TARGET_PRESET]["1"][CONTROLS_DATA] &&
                                stores.state.data[TARGET_PRESET]["1"][CONTROLS_DATA]["24"] &&
                                <pre>{JSON.stringify(stores.state.data[TARGET_PRESET]["1"][CONTROLS_DATA]["24"], null, 4)}</pre>
                            }
                            </div>
                            <div>7.13:
                            {stores.state.data &&
                                stores.state.data[TARGET_PRESET] &&
                                stores.state.data[TARGET_PRESET]["7"] &&
                                stores.state.data[TARGET_PRESET]["7"][CONTROLS_DATA] &&
                                stores.state.data[TARGET_PRESET]["7"][CONTROLS_DATA]["13"] &&
                                <pre>{JSON.stringify(stores.state.data[TARGET_PRESET]["7"][CONTROLS_DATA]["13"], null, 4)}</pre>
                            }
                            </div>
                            <div>7.24:
                            {stores.state.data &&
                                stores.state.data[TARGET_PRESET] &&
                                stores.state.data[TARGET_PRESET]["7"] &&
                                stores.state.data[TARGET_PRESET]["7"][CONTROLS_DATA] &&
                                stores.state.data[TARGET_PRESET]["7"][CONTROLS_DATA]["24"] &&
                                <pre>{JSON.stringify(stores.state.data[TARGET_PRESET]["7"][CONTROLS_DATA]["24"], null, 4)}</pre>
                            }
                            </div>
                            <div>13.24:
                            {stores.state.data &&
                                stores.state.data[TARGET_PRESET] &&
                                stores.state.data[TARGET_PRESET]["13"] &&
                                stores.state.data[TARGET_PRESET]["13"][CONTROLS_DATA] &&
                                stores.state.data[TARGET_PRESET]["13"][CONTROLS_DATA]["24"] &&
                                <pre>{JSON.stringify(stores.state.data[TARGET_PRESET]["13"][CONTROLS_DATA]["24"], null, 4)}</pre>
                            }
                            </div>
                            <div>19.24:
                            {stores.state.data &&
                                stores.state.data[TARGET_PRESET] &&
                                stores.state.data[TARGET_PRESET]["19"] &&
                                stores.state.data[TARGET_PRESET]["19"][CONTROLS_DATA] &&
                                stores.state.data[TARGET_PRESET]["19"][CONTROLS_DATA]["24"] &&
                                <pre>{JSON.stringify(stores.state.data[TARGET_PRESET]["19"][CONTROLS_DATA]["24"], null, 4)}</pre>
                            }
                            </div>
                        </div>
{/*
                        <div className="mt-20">{
                            Object.getOwnPropertyNames(stores.state.updateMessages).map(
                                p => <div key={p}>
                                    {p}:{Object.getOwnPropertyNames(stores.state.updateMessages[p]).map(
                                        pp => <div key={`${p}.${pp}`}>
                                            {p}.{pp}: <pre>{JSON.stringify(stores.state.updateMessages[p][pp])}</pre>
                                            </div>
                                    )}
                                </div>
                            )}
                        </div>
*/}

                        <Footer />
                    </div>
                </Router>
            // </Provider>
        );
    // }
});

// export default App;
