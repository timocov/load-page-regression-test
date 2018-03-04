#!/usr/bin/env node

import * as fs from 'fs';

import { ArgumentParser } from 'argparse';

import { runForUrls, UrlsConfig } from '../index';

function parseConfig(configPath: string): UrlsConfig {
	const content = fs.readFileSync(configPath, { encoding: 'utf-8' });
	const config = JSON.parse(content);
	if (typeof config !== 'object' || Array.isArray(config)) {
		throw new Error(`Type of config must be object`);
	}

	for (const url of Object.keys(config)) {
		if (typeof config[url] !== 'object' || Array.isArray(config[url])) {
			throw new Error(`Type of config for ${url} must be object`);
		}
	}

	return config;
}

function main(): void {
	const argsParser = new ArgumentParser({
		version: process.env.package_config_version,
	});

	argsParser.addArgument(
		['--config'],
		{
			type: 'string',
			defaultValue: '',
			help: 'Path to config file',
		}
	);

	argsParser.addArgument(
		['urls'],
		{
			nargs: '*',
			help: 'Urls to check',
		}
	);

	const args = argsParser.parseArgs();

	let urlsConfig: UrlsConfig;
	if (args.config.length !== 0) {
		if (args.urls.length !== 0) {
			throw new Error('URLs array cannot be used with --config');
		}

		urlsConfig = parseConfig(args.config);
	} else {
		if (args.urls.length === 0) {
			throw new Error('too few urls');
		}

		urlsConfig = {};
		for (const url of args.urls) {
			// assume that all rules enabled and has default parameters
			urlsConfig[url] = {};
		}
	}

	const runPromise = runForUrls(urlsConfig);
	runPromise.then((isSuccess: boolean) => {
		process.exit(isSuccess ? 0 : 1);
	});

	runPromise.catch((err: Error | string) => {
		console.error(err.toString());
		process.exit(1);
	});
}

main();