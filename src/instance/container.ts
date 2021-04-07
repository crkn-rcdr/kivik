import Docker from "dockerode";
import getPort from "get-port";
import { localhost as localNano } from "@crkn-rcdr/nano";
import { ServerScope } from "nano";
import pRetry from "p-retry";

import { Context, NormalizedInstanceConfig } from "../context";

export const createContainer = async (
	context: Context,
	instanceConfig: NormalizedInstanceConfig
): Promise<Container> => {
	const { port: desiredPort, image, user, password } = instanceConfig;

	const port = await getPort({ port: desiredPort });

	if (port !== desiredPort)
		context.log(
			"warn",
			`Port ${desiredPort} unavailable. Docker container will be available at port ${port}.`
		);

	const docker = new Docker();

	const dc = await docker.createContainer({
		Image: image,
		ExposedPorts: { "5984/tcp": {} },
		Env: [`COUCHDB_USER=${user}`, `COUCHDB_PASSWORD=${password}`],
		HostConfig: {
			PortBindings: {
				"5984/tcp": [{ HostPort: port.toString() }],
			},
		},
		Tty: true,
	});

	const name = (await dc.inspect()).Name.substring(1);

	return new Container({ dc, port, name, context });
};

interface ContainerArgs {
	readonly dc: Docker.Container;
	readonly port: number;
	readonly name: string;
	readonly context: Context;
}

class Container {
	private readonly dc: Docker.Container;
	private readonly port: number;
	private readonly name: string;
	readonly nano: ServerScope;
	private readonly context: Context;

	constructor(args: ContainerArgs) {
		this.dc = args.dc;
		this.port = args.port;
		this.name = args.name;
		this.nano = localNano(args.port, args.context.local);
		this.context = args.context;
	}

	async start() {
		this.context.log("info", `Starting container ${this.name}.`);
		await this.dc.start();
		this.context.log("info", `Container ${this.name} started.`);

		this.dc.attach(
			{ stream: true, stdout: true, stderr: true },
			(_, stream) => {
				if (stream) {
					stream.on("data", (chunk) => {
						this.context.log("couch", chunk.toString().trim());
					});
					stream.on("error", (error) => this.context.log("error", error));
					stream.on("end", () =>
						this.context.log(
							"info",
							`No longer attached to container ${this.name}.`
						)
					);
				}
			}
		);

		const createDb = async (db: string) => {
			return this.nano.relax({ path: db, method: "put", qs: { n: 1 } });
		};

		await pRetry(async () => {
			await createDb("_users");
			await createDb("_replicator");
			await createDb("_global_changes");
		});

		this.context.log(
			"success",
			`Kivik instance ready: http://localhost:${this.port}/_utils`
		);

		return this.nano;
	}

	async stop() {
		const inspect = await this.dc.inspect();
		if (inspect.State.Status) {
			await this.dc.stop();
			await this.dc.remove();
			this.context.log("info", `Container ${this.name} stopped and removed.`);
		} else {
			throw new Error(
				"Attempting to stop a Kivik container that is not started."
			);
		}
	}
}
