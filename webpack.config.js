module.exports = {

  entry: {
    app: './frontend/src/index.ts'
  },

  mode: 'development',
  devtool: 'inline-source-map',

  output: {
    filename: 'main.js',
    path: __dirname + '/frontend/static/frontend'

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
  }

};