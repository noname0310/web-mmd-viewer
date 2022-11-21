const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "bundle.js",
        assetModuleFilename: "static/[name][ext]"
    },
    optimization: {
        minimize: true
    },
    module: {
        rules: [{
                test: /\.tsx?$/,
                use: [{
                    loader: "ts-loader"
                }]
            },
            {
                test: /\.(png|jpg|gif|hdr)$/,
                type: "asset"
            },
            {
                test: /\.(mp3|ogg|wav)$/,
                loader: "file-loader",
                options: {
                    name: "asset/audio/[name].[ext]?[hash]"
                }
            },
            {
                test: /\.html$/,
                use: [{
                    loader: "html-loader"
                }]
            }
        ]
    },
    resolve: {
        modules: [path.join(__dirname, "src"), "node_modules"],
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        fallback: {
            fs: false,
            'path': false
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html"
        }),
        new ESLintPlugin({
            extensions: ["ts", "tsx"],
            fix: true
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: "mmd", to: "mmd" }]
        })
        //new BundleAnalyzerPlugin()
    ],
    devServer: {
        host: "0.0.0.0",
        allowedHosts: "all",
        port: 20310
    },
    mode: "development"
};
