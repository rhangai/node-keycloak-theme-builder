import path from 'path';
import webpack from 'webpack';
import fs from 'fs-extra';
import { createFsFromVolume, Volume } from 'memfs';
import walkSync from 'walk-sync';

const LOADER_HTML_RAW = path.resolve(__dirname, './loaders/html-raw-loader.ts');
const LOADER_MJML = path.resolve(__dirname, './loaders/mjml-loader.ts');
const LOADER_PUG = path.resolve(__dirname, './loaders/pug-loader.ts');

export type ThemeBuilderOptions = {
	themeDir: string;
	outputDir: string;
};

export class ThemeBuilder {
	private entry: any = {};
	private resources = /\.(png|jpg|jpeg|woff|woff2|ttf)$/i;

	/**
	 * Cria o construtor de tema
	 */
	constructor(private readonly options: ThemeBuilderOptions) {}

	/**
	 * Build the theme
	 */
	async build(): Promise<webpack.Stats> {
		// Resource loader
		const outputLoader = {
			loader: 'file-loader',
			options: {
				outputPath: 'theme',
				name(name: string) {
					const names = path.basename(name).split('.');
					return `${names[0]}.html`;
				},
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

		// Webpack config
		const config: webpack.Configuration = {
			mode: 'production',
			context: path.resolve(__dirname, '../.local/theme'),
			entry: {
				login: './login.pug',
				reset: './reset.mjml.pug',
			},
			output: {
				path: '/tmp/theme-builder',
				filename: 'tmp/[name].js',
			},
			module: {
				rules: [
					{
						test: /\.html$/,
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
							LOADER_HTML_RAW,
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
						test: /\.css$/,
						use: [resourceLoader, 'extract-loader', 'css-loader'],
					},
					{
						test: /\.scss$/,
						use: [
							resourceLoader,
							'extract-loader',
							'css-loader',
							'sass-loader',
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

		const webpackFs = this.createWebpackFs();
		const compiler = webpack(config);
		// @ts-ignore
		compiler.outputFileSystem = webpackFs;
		const stats = await new Promise<any>((resolve, reject) => {
			compiler.run((err: Error | null, stats: any) => {
				err ? reject(err) : resolve(stats);
			});
		});

		const files = walkSync('/tmp/theme-builder/theme', {
			fs: webpackFs,
			directories: false,
		});
		for (const file of files) {
			const content = webpackFs.readFileSync(
				path.join('/tmp/theme-builder/theme', file)
			);
			await fs.outputFile(
				path.resolve(this.options.outputDir, file),
				content
			);
		}
		return stats;
	}

	private createWebpackFs(): any {
		const fs = createFsFromVolume(new Volume());
		// @ts-ignore
		fs.join = require('memory-fs/lib/join');
		return fs;
	}
}
