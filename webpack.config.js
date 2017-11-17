const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
  entry: './src/',
  output: {
    filename: 'app.js',
    path: resolve(__dirname, 'dist')
  },
	resolve: {
		extensions: [ '.js', '.css', '.scss' ]
	},
  module: {
    rules: [
      { test: /\.js$/, exclude: /(node_modules)/, use: {
        loader: 'babel-loader', options: { presets: [ 'env' ] }
      } },
			{ test: /\.s?css$/, use: [
				{ loader: 'style-loader' },
				{ loader: 'css-loader' },
				{ loader: 'sass-loader' }
			] }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin()
  ]
};
