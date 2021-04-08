import { readFileSync } from "fs-extra";
import { dirname } from "path";
import { parse as parseYAML } from "yaml";
import { sync as findUp } from "find-up";

import { CommonArgv } from "../cli";
import { createLogger, LogLevel } from "./logger";
import { normalizeRc, NormalizedRc, Deployment, NanoDeployment } from "./rc";
import { get as remoteNano, localhost as localNano } from "@crkn-rcdr/nano";

export { logLevels, LogLevel } from "./logger";

export {
	Deployment,
	NanoDeployment,
	InstanceConfig,
	normalizeInstanceConfig,
	NormalizedInstanceConfig,
	Rc,
} from "./rc";

export type UnloggedContext = NormalizedRc & {
	readonly directory: string;
	readonly getDeployment: (key: string) => NanoDeployment;
	readonly withArgv: (argv: CommonArgv) => Context;
};

export type Context = Omit<UnloggedContext, "withArgv"> & {
	readonly log: (level: LogLevel, message: string) => void;
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

	if (confPath) directory = dirname(confPath);

	return {
		directory,
		...rc,
		getDeployment: function (key: string) {
			if (key in this.deployments) {
				const deployment = this.deployments[key] as Deployment;
				return {
					nano: remoteNano(deployment.url, deployment.auth),
					suffix: deployment.suffix,
					fixtures: !!deployment.fixtures,
				};
			} else if (key === "local") {
				return {
					nano: localNano(this.local.port, this.local),
					fixtures: this.local.fixtures,
				};
			} else {
				throw new Error(
					`Your kivikrc file does not have a deployment with key '${key}'`
				);
			}
		},
		withArgv: function (argv: CommonArgv) {
			// https://no-color.org
			if (process.env.hasOwnProperty("NO_COLOR")) argv.color = false;

			const logger = createLogger(argv);
			if (!confPath)
				logger.log(
					"warn",
					"No kivikrc file detected. Proceeding with defaults."
				);
			logger.log("info", "Logger initialized.");

			return {
				...this,
				log: (level: LogLevel, message: string) => logger.log(level, message),
				withDatabase: function (db: string): DatabaseContext {
					return {
						...this,
						log: (level: LogLevel, message: string) =>
							logger.log(level, `(${db}) ${message}`),
					};
				},
			};
		},
	};
};

export const defaultContext = (directory: string): Context => {
	return createContext(directory).withArgv({
		color: false,
		logLevel: "error",
		logTimestamp: false,
		quiet: true,
	});
};
