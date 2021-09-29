import React from 'react';
import {observer} from "mobx-react-lite";
import {stores} from "../stores";
// import Dropzone from "react-dropzone";
// import {dropOverlayStyle} from "../utils/misc";
import {PresetSelectorAndButtons} from "../components/PresetSelectorAndButtons";
import PresetsOverview from "../components/PresetsOverview";
import "./Overview.css";

// class Overview extends Component {
export const Overview = observer(() => {

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         // dropZoneActive: false
    //     };
    // }

/*
    onDragEnter = () => {
        this.setState({
            dropZoneActive: true
        });
    };

    onDragLeave= () => {
        this.setState({
            dropZoneActive: false
        });
    };

    onDrop = (files) => {
        // this.props.stores.state.clear();
        this.props.stores.state.changed = true;
        this.setState(
            { dropZoneActive: false },
            () => {this.props.stores.state.readFiles(files)}   // returned promise from readFiles() is ignored, this is normal.
        );
    };
*/

    // render() {
        // console.log("Overview: current preset", this.props.stores.state.currentPresetIndex);
    return (
/*
        <Dropzone
            disableClick
            style={{position: "relative"}}
            onDrop={this.onDrop}
            onDragEnter={this.onDragEnter}
            onDragLeave={this.onDragLeave}>
            {this.stores.state.dropZoneActive &&
            <div style={dropOverlayStyle}>
                Drop sysex file...
            </div>}
*/
            <div className="wrapper">
                <div className="content">
                    <div className="mb-20">
                        <PresetSelectorAndButtons showClearButton={true} overview={true} />
                    </div>
                    <div className="content-row-content">
                        <PresetsOverview data={stores.state.data}
                                         hexDisplay={!stores.state.decBase}
                                         extControls={stores.state.extControls}
                                         currentPreset={stores.state.currentPresetIndex}/>
                    </div>
                    {/*<LoadFactoryDefaultsButton />*/}
                </div>
            </div>
/*
        </Dropzone>
*/
    );

});
