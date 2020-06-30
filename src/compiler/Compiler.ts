import fs, { stat } from 'fs';
import path from 'path';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import { Union } from 'unionfs';
import { runInNewContext } from 'vm';
import walkSync from 'walk-sync';

const LOADER_MJML = path.resolve(__dirname, './loaders/mjml-loader');
const LOADER_PUG = path.resolve(__dirname, './loaders/pug-loader');

export type CompilerOptions = {
	themeDir: string;
	files: any;
};

export type CompilerOutput = {
	stats: webpack.Stats;
	error: boolean;
	outputFiles: any;
};

export class Compiler {
	private resources = /\.(png|jpg|jpeg|woff|woff2|ttf)$/i;

	/**
	 * Cria o construtor de tema
	 */
	constructor(private readonly options: CompilerOptions) {}

	get outputDir() {
		return '/tmp/theme-builder';
	}

	/**
	 * Build the theme
	 */
	async build(): Promise<CompilerOutput> {
		// Main points
		const themeDir = path.resolve(this.options.themeDir);
		const entrypoint = './__entry__.js';

		// Resource loader
		const resourceLoader = {
			loader: 'file-loader',
			options: {
				outputPath: 'resources',
				publicPath: '${resourcesPath}',
				name: '[name].[contenthash:8].[ext]',
			},
		};

		// Webpack config
		const config: webpack.Configuration = {
			mode: 'production',
			context: themeDir,
			entry: {
				theme: entrypoint,
			},
			target: 'node',
			output: {
				path: this.outputDir,
				filename: 'theme.js',
				library: '__THEME__',
				libraryTarget: 'assign',
			},
			resolveLoader: {
				extensions: ['.ts', '.js'],
			},
			module: {
				rules: [
					{
						test: /\.js$/,
						issuer: /\.(html|pug)$/,
						include: themeDir,
						use: [
							resourceLoader,
							{
								loader: 'babel-loader',
								options: {
									presets: ['@babel/preset-env'],
								},
							},
						],
					},
					{
						test: /\.html$/,
						use: [
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
							LOADER_MJML,
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

		// Compile using webpack
		const compiler = webpack(config);
		const inputFs = this.createInputFileSystem(
			compiler,
			path.join(themeDir, entrypoint)
		);
		const outputFs = this.createOutputFileSystem(compiler);
		const stats = await new Promise<webpack.Stats>((resolve, reject) => {
			compiler.run((err: Error | null, stats: any) => {
				err ? reject(err) : resolve(stats);
			});
		});
		if (stats.hasErrors()) {
			return { error: true, stats, outputFiles: {} };
		}

		// Get the output from the fs
		const outputFiles = {};
		this.getTheme(outputFs, outputFiles);
		this.getResources(outputFs, outputFiles);
		return { error: false, stats, outputFiles: outputFiles };
	}

	private getTheme(outputFs: any, outputFiles: any) {
		const output = outputFs.readFileSync(
			path.join(this.outputDir, 'theme.js')
		);

		const context = { __THEME__: null as any };
		runInNewContext(output as any, context);
		const theme = context.__THEME__;

		for (const key in theme) {
			outputFiles[`${key}.ftl`] = theme[key];
		}
	}

	private getResources(outputFs: any, outputFiles: any) {
		const resourcesDir = path.join(this.outputDir, 'resources');
		if (!outputFs.existsSync(resourcesDir)) return;
		const files = walkSync(resourcesDir, {
			fs: outputFs,
			directories: false,
		});

		for (const file of files) {
			const content = outputFs.readFileSync(
				path.join(resourcesDir, file)
			);
			outputFiles[path.join('resources', file)] = content;
		}
		return files;
	}

	private createInputFileSystem(compiler: any, entryPoint: string) {
		const entries = [];
		for (const key in this.options.files) {
			const file = this.options.files[key];
			entries.push(`${key}: require(${JSON.stringify(file)})`);
		}
		const virtualVolume = Volume.fromJSON({
			[entryPoint]: `module.exports = {
				${entries.join(',\n')}
			}`,
		});

		const inputFs = new Union();
		inputFs.use(fs);
		inputFs.use(virtualVolume as any);
		compiler.inputFileSystem = inputFs;
		return inputFs;
	}

	/**
	 * Output file system
	 * @param compiler
	 */
	private createOutputFileSystem(compiler: any) {
		const outputFs = createFsFromVolume(new Volume());
		// @ts-ignore
		outputFs.join = path.join;
		compiler.outputFileSystem = outputFs;
		return outputFs;
	}
}
