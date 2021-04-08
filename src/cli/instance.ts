import { UnloggedContext } from "../context";
import { createInstanceFromContext, Instance } from "../instance";
import { CommonArgv } from ".";

export default (unloggedContext: UnloggedContext) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: async (argv: CommonArgv) => {
			const context = unloggedContext.withArgv(argv);

			let instance: Instance | null = null;
			try {
				instance = await createInstanceFromContext(context);
				await instance.attach();
			} catch (error) {
				context.log(
					"error",
					`Error creating a Kivik instance: ${error.message}`
				);
				return;
			}

			const handle = async (signal: NodeJS.Signals) => {
				context.log("warn", `Received signal ${signal}. Closing.`);
				await (instance as Instance).stop();
			};

			try {
				await instance.deploy();
			} catch (error) {
				context.log(
					"error",
					`Error deploying Kivik files to the instance: ${error.message}`
				);
			}

			process.on("SIGINT", handle);
			process.on("SIGTERM", handle);
		},
	};
};
