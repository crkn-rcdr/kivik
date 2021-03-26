import { Logger } from "winston";
import { normalizeRc, NormalizedRc } from "./rc";
import { readFileSync as readFile } from "fs-extra";
import { parse as parseYAML } from "yaml";
import { sync as findUp } from "find-up";
import { create as createLogger, Level } from "./logger";
import { CommonArgv } from "../cli/parse";

export { format as defaultLoggerFormat } from "./logger";

export class Context {
	readonly directory: string;
	private logger: Logger | null;
	readonly rc: NormalizedRc;

	constructor(directory: string) {
		this.directory = directory;
		this.logger = null;
		const confPath = findUp(["kivikrc.json", "kivikrc.yml", "kivikrc.yaml"], {
			cwd: directory,
		});
		this.rc = normalizeRc(
			confPath ? parseYAML(readFile(confPath, { encoding: "utf-8" })) : {}
		);
	}

	createLogger(argv: CommonArgv) {
		this.logger = createLogger({
			color: argv.color,
			level: argv.logLevel,
			attachToConsole: !argv.quiet,
		});
		this.log("info", "Logger initialized.");
	}

	log(level: Level, message: any) {
		if (!this.logger) return;
		this.logger.log(level, message);
	}
}
