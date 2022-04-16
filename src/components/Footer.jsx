import React from 'react';
import "./Footer.css";

export const Footer = () => {
    return (
        <div className="footer">
            <div>
               This application is not endorsed by, directly affiliated with, maintained, or sponsored by Nektar Technology.
            </div>
            <div>
                Version __CLI_VERSION__
            </div>
        </div>
    );
};

