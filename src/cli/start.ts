import { UnloggedContext } from "../context";
import { createInstance } from "../instance";
import { CommonArgv } from ".";

export default (unloggedContext: UnloggedContext) => {
	return {
		command: ["start"],
		describe: "Starts a Kivik instance",
		handler: async (argv: CommonArgv) => {
			const context = unloggedContext.withArgv(argv);

			try {
				const instance = await createInstance(context, { attach: false });
				await instance.detach();
				instance.announce();
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
