import yargs from "yargs";

import { UnloggedContext, LogLevel, logLevels } from "../context";
import deploy from "./deploy";
import fixtures from "./fixtures";
import instance from "./instance";
import validate from "./validate";

export interface CommonArgv {
	color: boolean;
	logLevel: LogLevel;
	logTimestamp: boolean;
	quiet: boolean;
}

export const parse = (argv: string[], context: UnloggedContext): void => {
	yargs(argv)
		.scriptName("kivik")
		.options({
			color: {
				type: "boolean",
				default: true,
				describe: "Colorizes log output. --no-color for false",
			},
			logLevel: {
				type: "string",
				alias: "l",
				default: "warn",
				choices: logLevels,
			},
			logTimestamp: {
				type: "boolean",
				default: false,
				describe: "Print a timestamp with every logged line",
			},
			quiet: {
				type: "boolean",
				default: false,
				describe: "Silence log output",
			},
		} as const)
		.command(deploy(context))
		.command(fixtures(context))
		.command(instance(context))
		.command(validate(context))
		.wrap(null)
		.demandCommand(1, "Please specify a command.")
		.fail((msg, err, _yargs) => {
			if (err) throw err;
			// The default yargs error message for not enough positional args is a bit hard to grok
			if (msg.includes("Not enough non-option")) {
				if (argv[0] === "deploy")
					msg = "Missing the <deployment> argument for deploy.";
				if (argv[0] === "validate")
					msg = "<database> and <document> arguments required for validate.";
			}
			throw new Error(msg);
		}).argv;
};
