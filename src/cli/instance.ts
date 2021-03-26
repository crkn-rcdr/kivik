import { InitContext } from "../context";
import { get as getInstance } from "../instance";
import { CommonArgv } from "./parse";

export default (context: InitContext) => {
	return {
		command: ["instance", "dev", "inspect"],
		describe: "Spins up a local CouchDB instance for development",
		handler: async (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);

			const instance = await getInstance(fullContext);

			await instance.deploy();

			const handle = async (signal: NodeJS.Signals) => {
				fullContext.log("info", `Received signal ${signal}. Closing.`);
				await instance.stop();
			};

			process.on("SIGINT", handle);
			process.on("SIGTERM", handle);
		},
	};
};
