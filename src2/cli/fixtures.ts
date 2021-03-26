import { Context } from "../context";
import { CommonArgv } from "./parse";
import { init as createKivik } from "../kivik";

export default (context: Context) => {
	return {
		command: "fixtures",
		describe: "Test that each database's fixtures validate",
		handler: async (argv: CommonArgv) => {
			context.createLogger(argv);

			const kivik = await createKivik(context);
			const errors = Object.entries(kivik.validateFixtures());
			await kivik.close();

			for (const [name, errorString] of errors) {
				context.log(
					"error",
					`Validating fixture ${name} failed. Errors: ${errorString}`
				);
			}
			process.exit(errors.length);
		},
	};
};
