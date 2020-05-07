const path = require('path');
const BundleTracker = require('webpack-bundle-tracker');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
  context: __dirname,

  entry: {
    app: './frontend/src/index.ts'
  },

  mode: 'production',

  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve('./assets/bundles/'),
    publicPath: "/static/bundles/",
  },

  module: {

    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        }
      },

      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
      }

    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    }
  },

  plugins: [
    new BundleTracker({
      path: __dirname,
      filename: './webpack-stats.json',
    }),
    new CleanWebpackPlugin(),
  ],

};