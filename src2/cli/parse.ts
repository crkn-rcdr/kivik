import yargs from "yargs";
import { InitContext } from "../context";
import deploy from "./deploy";
import fixtures from "./fixtures";
import instance from "./instance";
import validate from "./validate";

export interface CommonArgv {
	color: boolean;
	logLevel: number;
	quiet: boolean;
}

export const parse = (argv: string[], context: InitContext): void => {
	yargs(argv)
		.scriptName("kivik")
		.options({
			color: {
				type: "boolean",
				default: true,
				describe: "Colorizes log output. --no-color for false",
			},
			logLevel: {
				type: "number",
				alias: "l",
				default: 1,
				describe:
					"Numerical log level.\n  0: errors and important notices\n  1: warnings\n  2: most things\n  3: when running an instance locally, shows CouchDB logs",
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