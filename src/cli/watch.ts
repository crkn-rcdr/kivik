import yargs from "yargs";

import { UnloggedContext } from "../context";
import { createInstance } from "../instance";
import { CommonArgv } from ".";

type WatchArgv = CommonArgv & {
	keep?: boolean;
};

export default (unloggedContext: UnloggedContext) => {
	return {
		command: ["watch", "dev", "instance", "inspect"],
		describe: "Attaches to a CouchDB container for development",
		builder: (yargs: yargs.Argv<CommonArgv>) =>
			yargs.option("keep", {
				type: "boolean",
				default: false,
				describe: "Keep the instance running after this process ends",
			}),
		handler: async (argv: WatchArgv) => {
			const context = unloggedContext.withArgv(argv);

			try {
				const instance = await createInstance(context);
				await instance.deploy();
				instance.announce();
				await instance.attach();

				const handle = async (signal: NodeJS.Signals) => {
					context.log("warn", `Received signal ${signal}. Closing.`);
					if (argv.keep) {
						await instance.detach();
						context.log(
							"warn",
							"The instance is still running. Run `kivik stop` to stop it, or `kivik watch` to re-attach to it."
						);
					} else {
						await instance.stop();
					}
				};

				process.on("SIGINT", handle);
				process.on("SIGTERM", handle);
			} catch (error) {
				context.log(
					"error",
					`Error creating a Kivik instance: ${error.message}`
				);
				process.exitCode = 1;
			}
		},
	};
};
