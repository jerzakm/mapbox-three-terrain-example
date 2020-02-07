const path = require("path")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const LinkTypePlugin = require('html-webpack-link-type-plugin').HtmlWebpackLinkTypePlugin


let isDevelopment = true

const ROOT = path.resolve(__dirname);

module.exports = {
    mode: "development",
    entry: {
        main: "./src/index.ts"
    },

    devtool: "eval-source-map",
    devServer: {
       contentBase: '.',
       hot: true
    },

    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist")
    },

    resolve: {
      extensions: [".tsx", ".ts", ".js", ".scss", ".css"]
    },

    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

    watch: true,
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
    },

    module: {
        rules: [
          {
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
          },
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/,
          },
          {
            test: /\.html$/,
            use: [{ loader: "html-loader", options: { minimize: true } }]
          }
        ]
      },

      plugins: [
        new MiniCssExtractPlugin({
          filename: 'style.[contenthash].css',
        }),
        new HtmlWebPackPlugin({
          template: "src/index.html",
          filename: "./index.html"
        }),
      ]
}