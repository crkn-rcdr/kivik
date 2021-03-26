import * as Winston from "winston";

export interface LoggerOptions {
	/** Log level, numerically */
	level: number;
	/** Whether log output should be colorized */
	color: boolean;
	/** Whether the console should be attached to log output */
	attachToConsole: boolean;
}

interface LogLevel {
	name: string;
	level: number;
	color: string;
}

const levels: LogLevel[] = [
	{ name: "success", level: 0, color: "bold green" },
	{ name: "error", level: 0, color: "bold red" },
	{ name: "warn", level: 1, color: "bold yellow" },
	{ name: "info", level: 2, color: "bold blue" },
	{ name: "couch", level: 3, color: "bold grey" },
];

export type Level = "success" | "error" | "warn" | "info" | "couch";

/**
 * Sets up Kivik's default logger format.
 * @param color Whether the user wants colorized output.
 */
export const format = (color: boolean): Winston.Logform.Format => {
	const wf = Winston.format;
	const formats = [
		wf.timestamp(),
		wf.printf(
			(info) => `${info["timestamp"]} -- ${info.level} -- ${info.message}`
		),
	];
	if (color) formats.unshift(wf.colorize());
	return wf.combine(...formats);
};

/**
 * Creates Kivik's logger.
 */
export const create = (options: LoggerOptions): Winston.Logger => {
	Winston.addColors(
		Object.fromEntries(levels.map((ll) => [ll.name, ll.color]))
	);

	const logger = Winston.createLogger({
		levels: Object.fromEntries(levels.map((ll) => [ll.name, ll.level])),
		level: levels.find((ll) => ll.level === options.level)?.name,
		handleExceptions: true,
	});

	if (options.attachToConsole) {
		logger.add(
			new Winston.transports.Console({ format: format(options.color) })
		);
	}

	return logger;
};
