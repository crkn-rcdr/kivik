import { UnloggedContext } from "../context";
import { createKivik } from "../kivik";
import { CommonArgv } from ".";

export default (unloggedContext: UnloggedContext) => {
	return {
		command: "fixtures",
		describe: "Test that each database's fixtures validate",
		handler: async (argv: CommonArgv) => {
			const context = unloggedContext.withArgv(argv);

			const kivik = await createKivik(context, "fixtures");
			const errors = Object.entries(kivik.validateFixtures());
			await kivik.close();

			process.exitCode = errors.length;
		},
	};
};
