import { Logger } from "winston";
import { normalizeRc, NormalizedRc } from "./rc";
import { readFileSync as readFile } from "fs-extra";
import { parse as parseYAML } from "yaml";
import { sync as findUp } from "find-up";
import { create as createLogger, Level } from "./logger";
import { CommonArgv } from "../cli/parse";

export { format as defaultLoggerFormat } from "./logger";

export type InitContext = {
	readonly directory: string;
	readonly rc: NormalizedRc;
	readonly withArgv: (argv: CommonArgv) => Context;
};

export type Context = Omit<InitContext, "withArgv"> & {
	readonly logger: Logger;
	readonly log: (level: Level, message: string) => void;
	readonly withDatabase: (db: string) => DatabaseContext;
};

export type DatabaseContext = Omit<Context, "withDatabase"> & {
	readonly database: string;
};

export const init = (directory: string): InitContext => {
	const confPath = findUp(["kivikrc.json", "kivikrc.yml", "kivikrc.yaml"], {
		cwd: directory,
	});
	const rc = normalizeRc(
		confPath ? parseYAML(readFile(confPath, { encoding: "utf-8" })) : {}
	);

	const withArgv = (argv: CommonArgv): Context => {
		const logger = createLogger({
			color: argv.color,
			level: argv.logLevel,
			attachToConsole: !argv.quiet,
		});

		const log = (level: Level, message: string) => logger.log(level, message);

		log("info", "Logger initialized.");

		const withDatabase = (db: string) => {
			return { directory, rc, logger, log, database: db };
		};

		return { directory, rc, logger, log, withDatabase };
	};

	return { directory, rc, withArgv };
};
