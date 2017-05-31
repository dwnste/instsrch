/* eslint-disable global-require */
const path = require('path');

module.exports = {
    entry: {
        index: [
            path.join(__dirname, './main.js'),
        ],
    },
    output: {
        path: path.join(__dirname, './dist/'),
        publicPath: '/dist/',
        filename: '[name].js',
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
        }, {
        }],
    },
    devtool: 'source-map'
};