var HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const extractCSS = new ExtractTextPlugin('[name].css');

const path = require('path');

module.exports = {
    entry: {
        'app': ['./src/app']
//        'app': ['webpack-dev-server/client?http://localhost:8008', './src/app']
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, './dist'),
        publicPath: '/'
    },
    devtool: "source-map", // or "inline-source-map"
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        }, {
            test: /\.scss$/i,
            loader: extractCSS.extract(['css?sourceMap', 'sass?sourceMap'])
        }]
    },
    plugins: [
        extractCSS, 
        new HtmlWebpackPlugin({
            chunks: ['app'],
            template: 'index.html', 
            hash: true,
            minify: {
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                useShortDoctype: true,
                removeComments: true
            }
        })
    ],
    sassLoader: {
        includePaths: [path.resolve(__dirname, "./src/css")]
    },
    devServer: {
        inline: true,
        port: 8008
    }
};