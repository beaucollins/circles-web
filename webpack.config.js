const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
	mode: 'production',
	devtool: 'source-map',
	context: resolve(__dirname, 'src'),
	entry: './app.jsx',
	output: {
		filename: '[name].js',
		path: resolve(__dirname, 'dist')
	},
	resolve: {
		extensions: [ '.js', '.css', '.scss', '.jsx' ],
		modules: [ 'src', 'node_modules' ],
	},
	module: {
		rules: [
			{ test: /\.jsx?$/, exclude: /(node_modules)/, use: {
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
			title: 'Proprietary Noise',
			hash: true,
			meta: {
				viewport: 'width=device-width, initial-scale=1',
			},
		} )
	]
};
