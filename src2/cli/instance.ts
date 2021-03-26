import { InitContext } from "../context";
import { CommonArgv } from "./parse";

export default (context: InitContext) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);
			fullContext.log("success", "instance");
		},
	};
};
