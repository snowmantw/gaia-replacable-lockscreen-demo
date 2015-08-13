'use strict';
var path = require('path');
module.exports = {
  entry: './src/Startup.js',
  devtool: 'inline-source-map',
  output: { path: __dirname + '/dist', filename: 'main.js' },
  resolve: { root: path.resolve('./') },
  module: {
    loaders: [
      { include: path.resolve(__dirname, './src'),
        test: /\.js$/,
        loader: 'babel-loader' }
    ]
  }
};
