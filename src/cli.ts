#!/usr/bin/env node
import { ThemeBuilder } from './ThemeBuilder';
import program from 'commander';

async function cli() {
	program
		.requiredOption('-t, --theme-dir <theme>', 'theme dir')
		.requiredOption('-o, --output-dir <output>', 'output dir');
	program.parse(process.argv);

	try {
		const builder = new ThemeBuilder({
			themeDir: program.themeDir,
			outputDir: program.outputDir,
		});
		await builder.generate();
	} catch (err) {
		console.error(err);
	}
}
cli();
