import { Compiler } from './compiler/Compiler';
import fs from 'fs-extra';
import path from 'path';

export type ThemeBuilderOptions = {
	themeDir: string;
	outputDir?: string;
};

export class ThemeBuilder {
	constructor(private readonly options: ThemeBuilderOptions) {}

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
		const output = await Promise.all([this.buildCompiler()]);

		let files = {};
		for (const o of output) {
			files = { ...o!.outputFiles };
		}
		return files;
	}

	/**
	 * Compile the theme
	 */
	private async buildCompiler() {
		const compiler = new Compiler({
			themeDir: this.options.themeDir,
			files: await this.getFiles(),
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
	private async getFiles() {
		const extensions = ['.mjml.pug', '.mjml', '.pug', '.html'];
		const inputFiles = await fs.readdir(this.options.themeDir);
		const files: Record<string, string> = {};
		for (const file of inputFiles) {
			const basename = path.basename(file).toLowerCase();
			for (const ext of extensions) {
				if (basename.endsWith(ext)) {
					const key = path.basename(basename, ext);
					if (files[key]) throw new Error(`Duplicate file ${file}`);
					files[key] = `./${file}`;
					break;
				}
			}
		}
		return files;
	}
}
