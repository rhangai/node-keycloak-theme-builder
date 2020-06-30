import { match } from 'assert';

export default function htmlRawLoader(source: string) {
	console.log(source);
	source = source.replace(
		/<ftl\s+value="(.*?)"\s*(>\s*<\/ftl>|\>)/gm,
		(match, value) => {
			return `<${value}>`;
		}
	);
	console.log(source);
	return source;
}
