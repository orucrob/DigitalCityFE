const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const extractCSS = new ExtractTextPlugin('[name].css');

const path = require('path');

module.exports = {
    entry: {
        'main': ['./src/main']
//        'main': ['webpack-dev-server/client?http://localhost:8008', './src/main']
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, './dist'),
        publicPath: ''
    },
    devtool: "source-map",//"cheap-module-source-map", //"source-map", // or "inline-source-map"
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        }, {
            test: /\.scss$/i,
            loader: extractCSS.extract(['css?sourceMap', 'sass?sourceMap'])
        },{
            test:  /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.ico$/,
            loader: 'file'
        }
        ]
    },
    plugins: [
        extractCSS, 
        new HtmlWebpackPlugin({
            chunks: ['main'],
            template: 'index.html', 
            hash: true,
            minify: {
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                useShortDoctype: true,
                removeComments: true
            }
        }),
        new CopyWebpackPlugin([
            { from: 'static' }
        ])
    ],
    sassLoader: {
        includePaths: [path.resolve(__dirname, "./src/css")]
    },
    devServer: {
        inline: true,
        port: 8008
    }
};