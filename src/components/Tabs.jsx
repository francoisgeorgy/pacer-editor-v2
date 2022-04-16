import React from 'react';
import "./Tabs.css";
import {Link, Route} from "react-router-dom";

const MenuLink = ({ label, to, activeOnlyWhenExact }) => (
    <Route
        path={to}
        exact={activeOnlyWhenExact}
        children={({ match }) => (
            <div className={match ? "tab tab-active" : "tab"}>
                <Link to={to}>{label}</Link>
            </div>
        )}
    />
);

export const Tabs = () => {
    return (
        <div className="tabs">
            <div className="tab-spacer">
            </div>
            <MenuLink activeOnlyWhenExact={true} to="/" label="Overview" />
            <div className="tab-spacer">
            </div>
            <MenuLink to="/preset"          label="Preset config" />
            <div className="tab-spacer">
            </div>
            <MenuLink to="/presetmidi"      label="Preset MIDI" />
            <div className="tab-spacer">
            </div>
            <MenuLink to="/patch"           label="Import/Export" />
            <div className="tab-spacer tab-filler">
            </div>
{/*
            <MenuLink to="/help"            label="Help" />
            <div className="tab-spacer">
            </div>
*/}
        </div>
    );
};

