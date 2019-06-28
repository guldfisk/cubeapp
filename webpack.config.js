// import path from 'path';

module.exports = {

  entry: {
    app: './frontend/src/index.js'
  },

  mode: 'development',

  output: {
    filename: 'main.js',
    path: __dirname + '/frontend/static/frontend'

  },

  module: {

    rules: [

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
  }

};