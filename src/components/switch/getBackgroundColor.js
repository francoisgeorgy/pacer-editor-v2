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

function createBackgroundColor(
    pos,
    checkedPos,
    uncheckedPos,
    offColor,
    onColor
) {
    const relativePos = (pos - uncheckedPos) / (checkedPos - uncheckedPos);
    if (relativePos === 0) {
        return offColor;
    }
    if (relativePos === 1) {
        return onColor;
    }

    let newColor = "#";
    for (let i = 1; i < 6; i += 2) {
        const offComponent = parseInt(offColor.substr(i, 2), 16);
        const onComponent = parseInt(onColor.substr(i, 2), 16);
        const weightedValue = Math.round(
            (1 - relativePos) * offComponent + relativePos * onComponent
        );
        let newComponent = weightedValue.toString(16);
        if (newComponent.length === 1) {
            newComponent = `0${newComponent}`;
        }
        newColor += newComponent;
    }
    return newColor;
}

function convertShorthandColor(color) {
    if (color.length === 7) {
        return color;
    }
    let sixDigitColor = "#";
    for (let i = 1; i < 4; i += 1) {
        sixDigitColor += color[i] + color[i];
    }
    return sixDigitColor;
}

export default function getBackgroundColor(
    pos,
    checkedPos,
    uncheckedPos,
    offColor,
    onColor
) {
    const sixDigitOffColor = convertShorthandColor(offColor);
    const sixDigitOnColor = convertShorthandColor(onColor);
    return createBackgroundColor(
        pos,
        checkedPos,
        uncheckedPos,
        sixDigitOffColor,
        sixDigitOnColor
    );
}
