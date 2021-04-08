import yargs from "yargs";

import { UnloggedContext } from "../context";
import { createKivik } from "../kivik";
import { CommonArgv } from ".";

type DeployArgv = CommonArgv & {
	deployment?: string;
};

export default (unloggedContext: UnloggedContext) => {
	return {
		command: "deploy <deployment>",
		describe: "Deploys design documents to a remote database",
		builder: (yargs: yargs.Argv<CommonArgv>) =>
			yargs.positional("deployment", {
				type: "string",
				describe: "Key of a deployment object in your kivikrc file",
			}),
		handler: async (argv: DeployArgv) => {
			const context = unloggedContext.withArgv(argv);

			let deployment;
			try {
				deployment = context.getDeployment(argv.deployment || "");
			} catch (error) {
				context.log("error", error.message);
				process.exit(1);
			}

			let kivik;
			try {
				kivik = await createKivik(context, "deploy");
				await kivik.deploy(deployment.nano, deployment.suffix);
				await kivik.close();
				process.exit(0);
			} catch (error) {
				context.log("error", `Error deploying: ${error.message}`);
				process.exitCode = 1;
			}

			if (kivik) await kivik.close();
		},
	};
};
