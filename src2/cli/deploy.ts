import yargs from "yargs";
import * as Nano from "@crkn-rcdr/nano";
import CouchDBNano from "nano";
import { CommonArgv } from "./parse";
import { InitContext } from "../context";
import { init as createKivik } from "../kivik";

type DeployArgv = CommonArgv & {
	// Even though the builder can't return undefined, the type system still expects the possibility
	deployment?: CouchDBNano.ServerScope;
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
				.coerce(
					"deployment",
					(key: string): CouchDBNano.ServerScope => {
						const deployment = context.rc.deployments?.[key];
						if (!deployment) {
							throw new Error(`No deployment in kivikrc for key ${key}`);
						}
						return Nano.get(deployment.url, deployment.auth);
					}
				),
		handler: async (argv: DeployArgv) => {
			const fullContext = context.withArgv(argv);
			const kivik = await createKivik(fullContext, "deploy");
			fullContext.log("success", "DEPLOY");
			await kivik.close();
		},
	};
};
