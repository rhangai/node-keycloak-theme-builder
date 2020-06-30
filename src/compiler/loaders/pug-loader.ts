import { requireModule } from './base';

export default function (this: any, source: string) {
	const pug = requireModule('pug');
	const template = pug.compile(source, {
		baseDir: this.context,
		filename: this.resourcePath,
	});
	return template({});
}
