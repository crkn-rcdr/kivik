import { UnloggedContext } from "../context";
import { getInstance } from "../instance";
import { CommonArgv } from ".";

export default (unloggedContext: UnloggedContext) => {
	return {
		command: ["stop"],
		describe: "Stops a Kivik instance",
		handler: async (argv: CommonArgv) => {
			const context = unloggedContext.withArgv(argv);

			try {
				const instance = await getInstance(context);
				await instance.stop();
			} catch (error) {
				context.log(
					"error",
					`Error stopping a Kivik instance: ${error.message}`
				);
				process.exitCode = 1;
			}
		},
	};
};
