import * as Winston from "winston";

export interface LoggerOptions {
	/** Log level, numerically */
	level: Level;
	/** Whether log output should be colorized */
	color: boolean;
	/** Whether the console should be attached to log output */
	attachToConsole: boolean;
}

const levelConfig: Record<Level, { level: number; color: string }> = {
	error: { level: 0, color: "bold red" },
	success: { level: 1, color: "bold green" },
	warn: { level: 2, color: "bold yellow" },
	info: { level: 3, color: "bold blue" },
	couch: { level: 4, color: "bold grey" },
};

export const levels = ["success", "error", "warn", "info", "couch"] as const;
export type Level = typeof levels[number];

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
	const colors = Object.fromEntries(
		Object.entries(levelConfig).map(([level, obj]) => [level, obj.color])
	);
	const wlevels = Object.fromEntries(
		Object.entries(levelConfig).map(([level, obj]) => [level, obj.level])
	);

	Winston.addColors(colors);

	const logger = Winston.createLogger({
		levels: wlevels,
		level: options.level,
		handleExceptions: true,
	});

	if (options.attachToConsole) {
		logger.add(
			new Winston.transports.Console({ format: format(options.color) })
		);
	}

	return logger;
};
