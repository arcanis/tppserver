import Virtjs from 'virtjs';

let canvas = document.querySelector(`#screen`);
let chatbox = document.querySelector(`#chatbox .content`);

let loglines = chatbox.getElementsByClassName(`.bot-line`);
let chatlines = chatbox.getElementsByClassName(`.user-line`);

let playerCount = document.querySelector('#player-count');

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
    line.className = `bot-line`;
    line.appendChild(document.createTextNode(`The selected input was ${data.input.name}!`));

    chatbox.appendChild(line);
    chatbox.scrollTop = chatbox.scrollHeight;

    playerCount.innerText = data.input.playerCount;

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
    line.className = `user-line`;
    line.appendChild(document.createTextNode(data.chat));

    chatbox.appendChild(line);
    chatbox.scrollTop = chatbox.scrollHeight;

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

    send(input);

});

let ignoreShortkeys = false;

userbox.addEventListener(`keydown`, e => {

    if (ignoreShortkeys)
        return;

    if (!e.shiftKey)
        return;

    switch (e.key) {

        case `ArrowUp`: {
            e.preventDefault();
            send(`up`);
        } break;

        case `ArrowDown`: {
            e.preventDefault();
            send(`down`);
        } break;

        case `ArrowLeft`: {
            e.preventDefault();
            send(`left`);
        } break;

        case `ArrowRight`: {
            e.preventDefault();
            send(`right`);
        } break;

        default: {
            return;
        } break;

    }

    ignoreShortkeys = true;

    setTimeout(() => {
        ignoreShortkeys = false;
    }, 1000);

});

function send(input) {

    websocket.send(JSON.stringify({ input }));

}

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
