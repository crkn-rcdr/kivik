import { UnloggedContext } from "../context";
import { createKivikFromContext } from "../kivik";
import { CommonArgv } from ".";

export default (unloggedContext: UnloggedContext) => {
	return {
		command: "fixtures",
		describe: "Test that each database's fixtures validate",
		handler: async (argv: CommonArgv) => {
			const context = unloggedContext.withArgv(argv);

			const kivik = await createKivikFromContext(context, "fixtures");
			const errors = Object.entries(kivik.validateFixtures());
			await kivik.close();

			process.exit(errors.length);
		},
	};
};
