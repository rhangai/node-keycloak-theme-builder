import webpack from 'webpack';
import { requireModule } from './base';
import { Union } from 'unionfs';
import fs from 'fs';
import path from 'path';
import { createFsFromVolume, Volume } from 'memfs';

export default function (this: any, source: string) {
	const inputVolume: any = Volume.fromJSON({
		[this.resourcePath]: source,
	});

	const outputFs: any = createFsFromVolume(new Volume());
	outputFs.join = path.join;

	const inputFs = new Union();
	inputFs.use(fs);
	inputFs.use(inputVolume);

	const compiler = webpack({
		context: this.context,
		entry: this.resourcePath,
		output: {
			path: '/tmp/script/',
			filename: 'output.js',
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
							},
						},
					],
				},
			],
		},
	});
	compiler.inputFileSystem = inputFs;
	compiler.outputFileSystem = outputFs;

	const callback = this.async();
	compiler.run((err, stats) => {
		if (err) {
			callback(err);
		} else if (stats.hasErrors()) {
			callback(new Error(stats.toString()));
		} else {
			callback(null, outputFs.readFileSync('/tmp/script/output.js'));
		}
	});
}
