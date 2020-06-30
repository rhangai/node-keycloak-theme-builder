import { Compiler } from './compiler/Compiler';
import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';

export type ThemeBuilderOptions = {
	themeDir: string;
	outputDir?: string;
};

export class ThemeBuilder {
	constructor(private readonly options: ThemeBuilderOptions) {}

	private glob(patterns: string | string[]): Promise<string[]> {
		return glob(patterns, { cwd: this.options.themeDir });
	}
	/**
	 * Generate every file
	 */
	async generate() {
		if (!this.options.outputDir) throw new Error(`Invalid output dir`);
		const files = await this.build();
		for (const key in files) {
			await fs.outputFile(
				path.join(this.options.outputDir, key),
				files[key]
			);
		}
	}

	/**
	 * Build the theme
	 */
	async build(): Promise<Record<string, string | Buffer>> {
		const output = await Promise.all([
			this.buildCompiler(),
			this.buildCopy(),
		]);

		let files = {};
		for (const o of output) {
			files = { ...files, ...o!.outputFiles };
		}
		return files;
	}

	/**
	 * Get the files to copy
	 */
	private async buildCopy() {
		const inputFiles = await this.glob([
			'theme.properties',
			'messages/*.properties',
			'text/**/*',
		]);
		const outputFiles: Record<string, string | Buffer> = {};
		for (const file of inputFiles) {
			outputFiles[file] = await fs.readFile(
				path.join(this.options.themeDir, file)
			);
		}
		return { outputFiles };
	}

	/**
	 * Compile the theme
	 */
	private async buildCompiler() {
		const compiler = new Compiler({
			themeDir: this.options.themeDir,
			files: await this.getCompilerFiles(),
		});
		const { error, stats, outputFiles } = await compiler.build();
		if (error) {
			throw new Error(stats.toString('errors-only'));
		}
		return { outputFiles };
	}

	/**
	 * Get the files to build
	 */
	private async getCompilerFiles() {
		const inputFiles = await this.glob([
			'*.{pug,mjml,html}',
			'html/*.{pug,mjml,html}',
		]);
		const files: Record<string, string> = {};
		for (const file of inputFiles) {
			const basename = path.basename(file).toLowerCase();
			if (basename.startsWith('_')) continue;
			let key = file.split('.')[0];
			if (files[key]) throw new Error(`Duplicate file ${file}`);
			files[key] = `./${file}`;
		}
		return files;
	}
}
