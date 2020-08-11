export function unicodeDecode(str: string) {
	return str.replace(/\\u([\d\w]{4})/gi, function (match, code) {
		return String.fromCharCode(parseInt(code, 16));
	});
}

export function unicodeEncode(str: string) {
	return str.replace(/[^\0-~]/g, function (ch) {
		const c = ('000' + ch.charCodeAt(0).toString(16)).slice(-4);
		return `\\u${c.toUpperCase()}`;
	});
}
