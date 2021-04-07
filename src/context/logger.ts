import * as Winston from "winston";
import { color as ansiColor, CSPair } from "ansi-styles";

import { CommonArgv } from "../cli";

export const logLevels = ["success", "error", "warn", "info", "couch"] as const;
export type LogLevel = typeof logLevels[number];

type LogLevelConfig = {
	level: number;
	color: CSPair;
	symbol: string;
};

const levelConfig: Record<LogLevel, LogLevelConfig> = {
	error: { level: 0, color: ansiColor.redBright, symbol: "✗" },
	success: { level: 1, color: ansiColor.greenBright, symbol: "✓" },
	warn: { level: 2, color: ansiColor.yellowBright, symbol: "!" },
	info: { level: 3, color: ansiColor.blueBright, symbol: "i" },
	couch: { level: 4, color: ansiColor.grey, symbol: "." },
};

/**
 * Sets up Kivik's default logger format.
 * @param argv Parsed command-line parameters common to all Kivik modes.
 */
const format = (argv: CommonArgv): Winston.Logform.Format => {
	const wf = Winston.format;
	const formats = [
		wf.timestamp(),
		wf.printf((info) => {
			const config = levelConfig[info.level as LogLevel];
			const timestamp = argv.logTimestamp ? `${info["timestamp"]} -- ` : "";
			const level = argv.color
				? `${config.color.open}${config.symbol.repeat(3)}${config.color.close}`
				: `${info.level} --`;
			return `${timestamp}${level} ${info.message}`;
		}),
	];
	return wf.combine(...formats);
};

/**
 * Creates Kivik's logger.
 * @param argv Parsed command-line parameters common to all Kivik modes.
 */
export const createLogger = (argv: CommonArgv): Winston.Logger => {
	const logger = Winston.createLogger({
		levels: Object.fromEntries(
			Object.entries(levelConfig).map(([level, obj]) => [level, obj.level])
		),
		level: argv.logLevel,
		handleExceptions: true,
		silent: argv.quiet,
	});

	logger.add(new Winston.transports.Console({ format: format(argv) }));

	return logger;
};
