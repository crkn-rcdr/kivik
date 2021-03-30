import { InitContext } from "../context";
import { createInstanceFromContext, Instance } from "../instance";
import { CommonArgv } from "./parse";

export default (context: InitContext) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: async (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);

			let instance: Instance | null = null;
			try {
				instance = await createInstanceFromContext(fullContext);
			} catch (error) {
				fullContext.log(
					"error",
					`Error creating a Kivik instance: ${error.message}`
				);
				return;
			}

			const handle = async (signal: NodeJS.Signals) => {
				fullContext.log("info", `Received signal ${signal}. Closing.`);
				await (instance as Instance).stop();
			};

			try {
				await instance.deploy();
			} catch (error) {
				fullContext.log(
					"error",
					`Error deploying Kivik files to the instance: ${error.message}`
				);
			}

			process.on("SIGINT", handle);
			process.on("SIGTERM", handle);
		},
	};
};
