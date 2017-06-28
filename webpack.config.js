module.exports = {

    entry: {

        client: `${__dirname}/assets/client.js`,

    },

    output: {

        path: `${__dirname}/builds`,
        publicPath: `/builds`,

        filename: `[name].bundle.js`,
        chunkFilename: `[id].bundle.js`

    },

    module: {

        rules: [ {
            test: /\.js$/,
            exclude: /\/node_modules\//,
            loader: `babel-loader`,
        } ]

    },

    node: {

        [`fs`]: `empty`

    }

};
