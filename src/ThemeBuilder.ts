import path from 'path';
import webpack from 'webpack';
import htmlRawLoader from './loaders/html-raw-loader';
// @ts-ignore
import merge from 'webpack-merge';

export class ThemeBuilder {
	private entry: any = {};

	/**
	 *
	 */
	static create() {
		return new ThemeBuilder();
	}

	/**
	 * Cria o construtor de tema
	 */
	constructor() {}

	/**
	 * Build the theme
	 */
	async build() {
		// Resource loader
		const resourceLoader = {
			loader: 'file-loader',
			options: {
				outputPath: 'theme/resources',
				publicPath: '${resourcePath}',
				name: '[name].[contenthash:8].[ext]',
			},
		};

		const configBase: webpack.Configuration = {
			output: {
				path: '/tmp/theme',
				filename: 'tmp/[name].js',
			},
			module: {
				rules: [
					{
						test: /\.html/,
						use: [
							{
								loader: 'file-loader',
								options: {
									outputPath: 'theme',
									name: '[name].html',
								},
							},
							{
								loader: path.resolve(
									__dirname,
									'./loaders/html-raw-loader.ts'
								),
							},
							'extract-loader',
							'html-loader',
						],
					},
					{
						test: /\.mjml\.pug$/,
						use: [
							{
								loader: 'file-loader',
								options: {
									outputPath: 'theme',
									name: '[name].html',
								},
							},
							'extract-loader',
							{
								loader: 'html-loader',
								options: {
									attributes: {
										list: [
											{
												tag: 'mj-image',
												attribute: 'src',
												type: 'src',
											},
										],
									},
								},
							},
							'pug-plain-loader',
						],
					},
					{
						test: /\.pug$/,
						exclude: /\.mjml\.pug$/,
						use: [
							{
								loader: 'file-loader',
								options: {
									outputPath: 'theme',
									name: '[name].html',
								},
							},
							'extract-loader',
							'html-loader',
							'pug-plain-loader',
						],
					},
					{
						test: /\.css/,
						use: [
							//
							resourceLoader,
							'extract-loader',
							'css-loader',
						],
					},
					{
						test: /\.png/,
						oneOf: [
							{
								resourceQuery: /inline/,
								use: ['url-loader'],
							},
							{
								use: [resourceLoader],
							},
						],
					},
				],
			},
		};

		const config = merge([configBase]);
		const compiler = webpack(config);
		await new Promise((resolve, reject) => {
			compiler.run((err: Error | null, stats: any) => {
				err ? reject(err) : resolve(stats);
			});
		});
	}
}
