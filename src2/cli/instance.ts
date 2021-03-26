import { InitContext } from "../context";
import { CommonArgv } from "./parse";
import { get as getInstance } from "../instance";

export default (context: InitContext) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: async (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);

			const instance = await getInstance(fullContext);

			const handle = async (signal: NodeJS.Signals) => {
				fullContext.log("info", `Received signal ${signal}. Closing.`);
				await instance.stop();
			};

			process.on("SIGINT", handle);
			process.on("SIGTERM", handle);
		},
	};
};
