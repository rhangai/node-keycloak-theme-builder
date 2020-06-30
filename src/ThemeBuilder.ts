import path from 'path';
import webpack from 'webpack';
import htmlRawLoader from './loaders/html-raw-loader';
// @ts-ignore
import merge from 'webpack-merge';

const LOADER_HTML_RAW = path.resolve(__dirname, './loaders/html-raw-loader.ts');
const LOADER_MJML = path.resolve(__dirname, './loaders/mjml-loader.ts');
const LOADER_PUG = path.resolve(__dirname, './loaders/pug-loader.ts');

export class ThemeBuilder {
	private entry: any = {};
	private resources = /\.(png|jpg|jpeg|woff|woff2|ttf)$/i;

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
		const outputLoader = {
			loader: 'file-loader',
			options: {
				outputPath: 'theme',
				name: '[name].html',
			},
		};
		const resourceLoader = {
			loader: 'file-loader',
			options: {
				outputPath: 'theme/resources',
				publicPath: '${resourcePath}',
				name: '[name].[contenthash:8].[ext]',
			},
		};

		const configBase: webpack.Configuration = {
			context: path.resolve(__dirname, '../.local/theme'),
			entry: {
				login: './login.pug',
				reset: './reset.mjml.pug',
			},
			output: {
				path: path.resolve(__dirname, '../.local/tmp/theme'),
				filename: 'tmp/[name].js',
			},
			module: {
				rules: [
					{
						test: /\.html/,
						use: [
							outputLoader,
							LOADER_HTML_RAW,
							'extract-loader',
							{
								loader: 'html-loader',
								options: {
									minimize: {
										removeAttributeQuotes: false,
									},
								},
							},
						],
					},
					{
						test: /\.mjml\.pug$/,
						use: [
							outputLoader,
							LOADER_MJML,
							'extract-loader',
							{
								loader: 'html-loader',
								options: {
									minimize: {
										removeAttributeQuotes: false,
									},
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
							LOADER_PUG,
						],
					},
					{
						test: /\.pug$/,
						exclude: /\.mjml\.pug$/,
						use: [
							outputLoader,
							LOADER_HTML_RAW,
							'extract-loader',
							{
								loader: 'html-loader',
								options: {
									minimize: {
										removeAttributeQuotes: false,
									},
								},
							},
							LOADER_PUG,
						],
					},
					{
						test: /\.css/,
						use: [
							// Load the css
							resourceLoader,
							'extract-loader',
							'css-loader',
						],
					},
					{
						test: this.resources,
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
		const stats = await new Promise<any>((resolve, reject) => {
			compiler.run((err: Error | null, stats: any) => {
				err ? reject(err) : resolve(stats);
			});
		});
		return stats;
	}
}
