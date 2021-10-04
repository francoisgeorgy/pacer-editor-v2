// Source: https://github.com/markusenglund/react-switch
/*
The MIT License (MIT)

Copyright (c) 2015 instructure-react

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Make sure color props are strings that start with "#" since other ways to write colors are not supported.
const hexColorPropType = (props, propName, componentName) => {
    const prop = props[propName];
    if (
        typeof prop !== "string" ||
        prop[0] !== "#" ||
        (prop.length !== 4 && prop.length !== 7)
    ) {
        return new Error(
            `Invalid prop '${propName}' supplied to '${componentName}'. '${propName}' has to be either a 3-digit or 6-digit hex-color string. Valid examples: '#abc', '#123456'`
        );
    }
    return null;
};

export default hexColorPropType;
