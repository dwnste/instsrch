/* eslint-disable global-require */
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        index: [
            path.join(__dirname, './index.js'),
        ],
    },
    output: {
        path: path.join(__dirname, './dist/'),
        publicPath: '/dist/',
        filename: '[name].js',
    },
    externals: {
        ymaps: "ymaps",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallbackLoader: 'style-loader', loader: 'css-loader!sass-loader'
                })
            }
        ],
    },
    plugins: [
        new ExtractTextPlugin("style.css")
    ],
    devtool: 'source-map',
    devServer: {
        host: '0.0.0.0'
    }
};