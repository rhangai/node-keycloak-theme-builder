import { ThemeBuilder } from './ThemeBuilder';
import path from 'path';

async function main() {
	try {
		const builder = new ThemeBuilder({
			outputDir: path.resolve('dist'),
			themeDir: '.local/theme',
		});
		const stats = await builder.build();
		console.log(stats.toString({ colors: true }));
	} catch (err) {
		console.error(err);
	}
}
main();
