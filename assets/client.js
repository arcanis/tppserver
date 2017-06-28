import Virtjs from 'virtjs';

let canvas = document.querySelector(`#screen`);
let logbox = document.querySelector(`#logbox`);
let chatbox = document.querySelector(`#chatbox`);
let userbox = document.querySelector(`#userbox`);

let loglines = logbox.getElementsByClassName(`.line`);
let chatlines = chatbox.getElementsByClassName(`.line`);

// ---

let websocket = new WebSocket(`ws://${location.host}`);
websocket.binaryType = `arraybuffer`;

// ---

websocket.addEventListener(`message`, e => {

    if (typeof e.data !== `string`)
        return;

    let data = JSON.parse(e.data);

    if (!data.input)
        return;

    if (loglines.length >= 30)
        loglines[0].remove();

    let line = document.createElement(`div`);
    line.className = `line`;
    line.appendChild(document.createTextNode(`${data.input.name} (${Math.round(data.input.percent * 100)}%)`));

    logbox.appendChild(line);

});

// ---

websocket.addEventListener(`message`, e => {

    if (typeof e.data !== `string`)
        return;

    let data = JSON.parse(e.data);

    if (!data.chat)
        return;

    if (chatlines.length >= 30)
        chatlines[0].remove();

    let line = document.createElement(`div`);
    line.className = `line`;
    line.appendChild(document.createTextNode(data.chat));

    chatbox.appendChild(line);

});

// ---

userbox.addEventListener(`blur`, e => {

    userbox.focus();

});

userbox.addEventListener(`keydown`, e => {

    if (e.key !== `Enter`)
        return;

    let input = userbox.value;
    userbox.value = ``;

    websocket.send(JSON.stringify({ input }));

});

// ---

let screen = new Virtjs.devices.screens.WebGLScreen({ canvas });

window.addEventListener(`resize`, () => {

    let outputWidth = canvas.offsetWidth;
    let outputHeight = canvas.offsetHeight;

    screen.setOutputSize(outputWidth, outputHeight);

});

// ---

let renderTimer = null;

websocket.addEventListener(`message`, e => {

    if (typeof e.data !== `string`)
        return;

    let data = JSON.parse(e.data);

    if (!data.screenSettings)
        return;

    let inputWidth = data.screenSettings.inputWidth;
    let inputHeight = data.screenSettings.inputHeight;
    let inputPitch = data.screenSettings.inputPitch;

    let inputFormat = data.screenSettings.inputFormat;

    screen.setInputSize(inputWidth, inputHeight, inputPitch);
    screen.setInputFormat(inputFormat);

});

websocket.addEventListener(`message`, e => {

    if (typeof e.data === `string`)
        return;

    screen.setInputData(new Uint16Array(e.data));

    if (renderTimer !== null)
        return;

    renderTimer = requestAnimationFrame(() => {
        renderTimer = null;
        screen.flushScreen();
    });

});
