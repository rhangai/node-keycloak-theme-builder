export function requireModule(moduleName: string) {
	try {
		const value = require(moduleName);
		if ('default' in value) return value['default'];
		return value;
	} catch (err) {
		throw new Error(
			`Invalid dependency "${moduleName}". Please add it to your dependencies`
		);
	}
}
