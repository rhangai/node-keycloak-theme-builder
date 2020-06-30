import { Compiler } from './compiler/Compiler';
import path from 'path';

async function main() {
	try {
		const builder = new Compiler({
			themeDir: '.local/theme',
			files: {
				login: './login.pug',
			},
		});
		const { stats, outputFiles } = await builder.build();
		console.log(stats.toString({ colors: true }));
		console.log(outputFiles);
	} catch (err) {
		console.error(err);
	}
}
main();
