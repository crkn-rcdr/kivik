import yargs from "yargs";
import { emitKeypressEvents } from "readline";

import { NanoDeployment, UnloggedContext } from "../context";
import { createKivik, Kivik } from "../kivik";
import { CommonArgv } from ".";

type DeployArgv = CommonArgv & {
	deployment?: string;
	watch?: boolean;
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
				.option("watch", {
					type: "boolean",
					default: false,
					describe:
						"Start a process that watches for and deploys changes to Kivik files",
				}),
		handler: async (argv: DeployArgv) => {
			const context = unloggedContext.withArgv(argv);

			let deployment: NanoDeployment;
			try {
				deployment = await context.getDeployment(argv.deployment || "");
			} catch (error) {
				context.log("error", error.message);
				process.exit(1);
			}

			let kivik: Kivik;

			try {
				kivik = await createKivik(
					context,
					deployment.fixtures ? "instance" : "deploy"
				);
			} catch (error) {
				context.log("error", `Error creating Kivik object: ${error.message}`);
				process.exit(1);
			}

			try {
				await kivik.deploy(deployment);

				const quit = async () => {
					await kivik.close();
					process.exit(0);
				};

				if (argv.watch) {
					const handleSignal = async (signal: NodeJS.Signals) => {
						context.log("warn", `Received signal ${signal}. Closing.`);
						await quit();
					};

					if (process.stdin && process.stdin.isTTY) {
						emitKeypressEvents(process.stdin);
						process.stdin.setRawMode(true);
						process.stdin.on("keypress", async (_, key) => {
							if (key.name === "x") {
								context.log("warn", "Quitting.");
								await quit();
							} else if (key.name === "r") {
								context.log("warn", "Redeploying.");
								await kivik.deploy(deployment);
							}
						});
						context.log(
							"warn",
							"Press 'x' to quit. Press 'r' to redeploy Kivik files."
						);
					}

					process.on("SIGINT", handleSignal);
					process.on("SIGTERM", handleSignal);

					kivik.deployOnChanges(deployment.nano);
				} else {
					await quit();
				}
			} catch (error) {
				context.log("error", `Error deploying: ${error.message}`);
				process.exitCode = 1;
			}
		},
	};
};
