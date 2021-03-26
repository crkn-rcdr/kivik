import { InitContext } from "../context";
import { get as createKivik } from "../kivik";
import { CommonArgv } from "./parse";

export default (context: InitContext) => {
	return {
		command: "fixtures",
		describe: "Test that each database's fixtures validate",
		handler: async (argv: CommonArgv) => {
			const fullContext = context.withArgv(argv);

			const kivik = await createKivik(fullContext, "fixtures");
			const errors = Object.entries(kivik.validateFixtures());
			await kivik.close();

			for (const [name, errorString] of errors) {
				fullContext.log(
					"error",
					`Validating fixture ${name} failed. Errors: ${errorString}`
				);
			}
			process.exit(errors.length);
		},
	};
};
