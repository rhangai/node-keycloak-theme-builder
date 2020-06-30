import { ThemeBuilder } from './ThemeBuilder';

async function main() {
	try {
		const stats = await ThemeBuilder.create().build();
		console.log(stats.toString({ colors: true }));
	} catch (err) {
		console.error(err);
	}
}
main();
