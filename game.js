import Fs     from 'fs';

import Engine from 'arch.js/dist/archjs-gambatte';
import Virtjs from 'virtjs';

export default function (app, game) {

    let screen = new Virtjs.devices.screens.NullScreen({ flushCallback });
    let timer = new Virtjs.devices.timers.TimeoutTimer();
    let audio = new Virtjs.devices.audio.NullAudio();
    let input = new Virtjs.devices.inputs.ManualInput({ codeMap: Engine.codeMap });

    let engine = new Engine({ devices: { screen, timer, audio, input } });

    // ---

    setInterval(() => {

        Fs.writeFileSync(`${__dirname}/gold.sav`, new Buffer(engine.getState()));

    }, 60 * 1000);

    // ---

    Virtjs.utils.DataUtils.fetchArrayBuffer(`${__dirname}/assets/gold.gbc`).then(arrayBuffer => {

        Virtjs.utils.DataUtils.fetchArrayBuffer(`${__dirname}/gold.sav`).catch(() => {

            return null;

        }).then(initialState => {

            engine.loadArrayBuffer(arrayBuffer, { initialState });

            timer.start();

        });

    }, error => {

        console.log(error.stack);

    });

    // ---

    let inputStorage = new Map();

    setInterval(() => {

        let bestInputs = [ `LEFT`, `RIGHT`, `UP`, `DOWN`, `A`, `B` ];
        let bestVotes = 0;

        let totalVotes = 0;

        for (let [ input, votes ] of inputStorage.entries()) {

            totalVotes += votes;

            if (votes < bestVotes)
                continue;

            if (votes > bestVotes)
                bestInputs = [];

            bestInputs.push(input);
            bestVotes = votes;

        }

        inputStorage.clear();

        let finalInput = bestInputs[Math.floor(Math.random() * bestInputs.length)];

        input.down(0, finalInput);

        setTimeout(() => {
            input.up(0, finalInput);
        }, 200);

        for (let client of app.ws.server.clients) {

            if (client.readyState !== 1)
                continue;

            client.send(JSON.stringify({
                input: { name: finalInput, percent: bestVotes !== 0 ? bestVotes / totalVotes : null, playerCount: app.ws.server.clients.size }
            }));

        }

    }, 1000);

    // -- When a client connects, we send it the current formatting

    app.ws.use((ctx, next) => {

        ctx.websocket.on(`message`, message => {

            if (message.length > 256)
                return;

            let data = null;

            try {
                data = JSON.parse(message);
            } catch (error) {
                // bad client :(
            }

            if (typeof data !== `object` || typeof data.input !== `string`)
                return;

            let input = data.input;

            let normalized = input.toUpperCase().trim();
            let validated = Reflect.ownKeys(Engine.codeMap).includes(normalized);

            if (validated)
                inputStorage.set(normalized, (inputStorage.get(normalized) || 0) + 1);

            for (let client of app.ws.server.clients) {

                if (client.readyState !== 1)
                    continue;

                client.send(JSON.stringify({
                    chat: input
                }));

            }

        });

        ctx.websocket.send(JSON.stringify({ screenSettings: {

            inputWidth: screen.inputWidth,
            inputHeight: screen.inputHeight,
            inputPitch: screen.inputPitch,

            inputFormat: screen.inputFormat,

        } }));

        if (frame)
            ctx.websocket.send(frame);

        return next(ctx);

    });

    // -- The following code will emit each frame to each client

    let frame = null;

    function flushCallback() {

        let data = screen.inputData;

        if (frame && Virtjs.utils.DataUtils.areEqualViews(data, frame))
            return;

        frame = data.slice();

        for (let client of app.ws.server.clients) {

            if (client.readyState !== 1)
                continue;

            client.send(frame);

        }

    };

};
