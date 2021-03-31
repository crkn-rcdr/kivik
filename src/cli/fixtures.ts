import { InitContext } from "../context";
import { createKivikFromContext } from "../kivik";
import { CommonArgv } from "./parse";

export default (context: InitContext) => {
	return {
		command: "fixtures",
		describe: "Test that each database's fixtures validate",
		handler: async (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);

			const kivik = await createKivikFromContext(fullContext, "fixtures");
			const errors = Object.entries(kivik.validateFixtures());
			await kivik.close();

			process.exit(errors.length);
		},
	};
};
