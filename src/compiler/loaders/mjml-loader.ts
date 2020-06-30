import { requireModule } from './base';

export default function (this: any, source: string) {
	const mjml = requireModule('mjml');
	const output = mjml(source);
	if (output.errors && output.errors.length > 0) {
		throw new Error(
			output.errors.map((t: any) => t.formattedMessage).join('\n\n')
		);
	}
	return output.html;
}
