import mount      from 'koa-mount';
import routes     from 'koa-route';
import statics    from 'koa-static';
import build      from 'koa-webpack';
import websockify from 'koa-websocket';
import Koa        from 'koa';
import webpack    from 'webpack';

import game       from './game';

let app = websockify(new Koa());

// Serve the statics assets to the root
app.use(statics(`${__dirname}/assets`));

// Serve the application directly from webpack
app.use(build({ compiler: webpack(require(`./webpack.config.js`)) }));

// Serve a new game instance
game(app, `${__dirname}/assets/gold.gbc`);

app.listen(3000, () => {
    console.log(`Ready`);
});
