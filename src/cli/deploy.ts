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
			yargs
				.positional("deployment", {
					type: "string",
					describe: "Key of a deployment object in your kivikrc file",
				})
				.check((argv: DeployArgv): boolean => {
					const key = argv.deployment as string;
					const deployment = unloggedContext.deployments[key];

					if (!deployment)
						throw new Error(`No deployment in kivikrc for key ${key}`);

					return true;
				}),
		handler: async (argv: DeployArgv) => {
			const context = unloggedContext.withArgv(argv);
			const kivik = await createKivik(context, "deploy");

			await kivik.deployTo(argv.deployment as string);

			await kivik.close();
		},
	};
};
