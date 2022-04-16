import React from 'react';
import "./Tabs.css";

export const Tabs = () => {
    return (
        <div className="tabs">
            <div className="tab-spacer">
            </div>
            <div className="tab tab-active">
                Overview
            </div>
            <div className="tab-spacer">
            </div>
            <div className="tab">
                Preset config
            </div>
            <div className="tab-spacer">
            </div>
            <div className="tab">
                Preset MIDI
            </div>
            <div className="tab-spacer">
            </div>
            <div className="tab">
                Import/Export
            </div>
            <div className="tab-spacer tab-filler">
            </div>
        </div>
    );
};

