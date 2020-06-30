import { match } from 'assert';

export default function htmlRawLoader(source: string) {
	source = source.replace(
		/<ftl\s+value="(.*?)"\s*(>\s*<\/ftl>|\>)/gm,
		(match, value) => {
			return `<${value}>`;
		}
	);
	return source;
}
