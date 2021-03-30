import yargs from "yargs";
import { get as getNano } from "@crkn-rcdr/nano";

import { Deployment, InitContext } from "../context";
import { get as createKivik } from "../kivik";
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
			const kivik = await createKivik(fullContext, "deploy");

			const deployment = context.rc.deployments[
				argv.deployment as string
			] as Deployment;

			await kivik.deploy(
				getNano(deployment.url, deployment.auth),
				deployment.suffix
			);

			await kivik.close();
		},
	};
};
