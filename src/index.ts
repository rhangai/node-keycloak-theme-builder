import { ThemeBuilder } from './ThemeBuilder';

async function main() {
	try {
		const builder = new ThemeBuilder({
			themeDir: '.local/theme',
			outputDir: '.local/dist',
		});
		await builder.generate();
	} catch (err) {
		console.error(err);
	}
}
main();
