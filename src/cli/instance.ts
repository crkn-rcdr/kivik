import { InitContext } from "../context";
import { get as getInstance, Instance } from "../instance";
import { CommonArgv } from "./parse";

export default (context: InitContext) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: async (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);

			let instance: Instance | null = null;
			try {
				instance = await getInstance(fullContext);
			} catch (error) {
				fullContext.log(
					"error",
					`Error creating a Kivik instance: ${error.message}`
				);
			}

			try {
				await (instance as Instance).deploy();
			} catch (error) {
				fullContext.log(
					"error",
					`Error deploying Kivik files to the instance: ${error.message}`
				);
			}

			const handle = async (signal: NodeJS.Signals) => {
				fullContext.log("info", `Received signal ${signal}. Closing.`);
				await (instance as Instance).stop();
			};

			process.on("SIGINT", handle);
			process.on("SIGTERM", handle);
		},
	};
};
