import yargs from "yargs";

import { InitContext } from "../context";
import { createKivikFromContext } from "../kivik";
import { CommonArgv } from "./parse";

type DeployArgv = CommonArgv & {
	deployment?: string;
};

export default (context: InitContext) => {
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
					const deployment = context.rc.deployments[key];

					if (!deployment)
						throw new Error(`No deployment in kivikrc for key ${key}`);

					return true;
				}),
		handler: async (argv: DeployArgv) => {
			const fullContext = context.withArgv(argv);
			const kivik = await createKivikFromContext(fullContext, "deploy");

			await kivik.deployTo(argv.deployment as string);

			await kivik.close();
		},
	};
};
