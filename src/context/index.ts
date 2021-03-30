import { Logger } from "winston";
import { readFileSync } from "fs-extra";
import { parse as parseYAML } from "yaml";
import { sync as findUp } from "find-up";

import { CommonArgv } from "../cli/parse";
import { createLogger, Level } from "./logger";
import { normalizeRc, NormalizedRc } from "./rc";

export {
	format as defaultLoggerFormat,
	levels as logLevels,
	Level as LogLevel,
} from "./logger";

export {
	Deployment,
	InstanceConfig,
	normalizeInstanceConfig,
	NormalizedInstanceConfig,
} from "./rc";

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

export const createContext = (directory: string): InitContext => {
	const confPath = findUp(["kivikrc.json", "kivikrc.yml", "kivikrc.yaml"], {
		cwd: directory,
	});
	const rc = normalizeRc(
		confPath ? parseYAML(readFileSync(confPath, { encoding: "utf-8" })) : {}
	);

	const withArgv = (argv: CommonArgv): Context => {
		const logger = createLogger(argv);

		const log = (level: Level, message: string) => logger.log(level, message);

		log("info", "Logger initialized.");

		const withDatabase = (db: string) => {
			const log = (level: Level, message: string) =>
				logger.log(level, `(${db}) ${message}`);

			return { directory, rc, logger, log, database: db };
		};

		return { directory, rc, logger, log, withDatabase };
	};

	return { directory, rc, withArgv };
};

export const apiContext = (directory: string): Context => {
	return createContext(directory).withArgv({
		color: false,
		logLevel: "error",
		quiet: true,
	});
};
