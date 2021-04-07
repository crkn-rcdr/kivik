import { readFileSync } from "fs-extra";
import { parse as parseYAML } from "yaml";
import { sync as findUp } from "find-up";

import { CommonArgv } from "../cli";
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
	Rc,
} from "./rc";

export type UnloggedContext = NormalizedRc & {
	readonly directory: string;
	readonly withArgv: (argv: CommonArgv) => Context;
};

export type Context = Omit<UnloggedContext, "withArgv"> & {
	readonly log: (level: Level, message: string) => void;
	readonly withDatabase: (db: string) => DatabaseContext;
};

export type DatabaseContext = Omit<Context, "withDatabase">;

export const createContext = (directory: string): UnloggedContext => {
	const confPath = findUp(["kivikrc.json", "kivikrc.yml", "kivikrc.yaml"], {
		cwd: directory,
	});
	const rc = normalizeRc(
		confPath ? parseYAML(readFileSync(confPath, { encoding: "utf-8" })) : {}
	);

	return {
		directory,
		...rc,
		withArgv: function (argv: CommonArgv): Context {
			// https://no-color.org
			if (process.env.hasOwnProperty("NO_COLOR")) argv.color = false;

			const logger = createLogger(argv);
			logger.log("info", "Logger initialized.");

			return {
				...this,
				log: (level: Level, message: string) => logger.log(level, message),
				withDatabase: function (db: string): DatabaseContext {
					return {
						...this,
						log: (level: Level, message: string) =>
							logger.log(level, `(${db}) ${message}`),
					};
				},
			};
		},
	};
};

export const apiContext = (directory: string): Context => {
	return createContext(directory).withArgv({
		color: false,
		logLevel: "error",
		quiet: true,
	});
};
