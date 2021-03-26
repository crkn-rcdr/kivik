import { Context } from "../context";
import { CommonArgv } from "./parse";

export default (context: Context) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: (argv: CommonArgv) => {
			context.createLogger(argv);
			context.log("success", "instance");
		},
	};
};
