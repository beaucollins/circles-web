const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
  devtool: 'source-map',
  entry: './src/index.js',
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist')
  },
	resolve: {
		extensions: [ '.js', '.css', '.scss' ]
	},
  module: {
    rules: [
      { test: /\.js$/, exclude: /(node_modules)/, use: {
        loader: 'babel-loader', options: { presets: [ '@babel/preset-env' ] }
      } },
			{ test: /\.s?css$/, use: [
				{ loader: 'style-loader' },
				{ loader: 'css-loader' },
				{ loader: 'sass-loader' }
			] }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin( {
      template: './app.html',
      title: 'Proprietary Noise',
      hash: true
    } )
  ]
};
