import { join as pathJoin } from "path";
import { readFile, writeFile, unlink as deleteFile } from "fs-extra";
import Docker from "dockerode";
import getPort from "get-port";
import { localhost as localNano } from "@crkn-rcdr/nano";
import { ServerScope } from "nano";
import pRetry from "p-retry";

import { Context, NormalizedInstanceConfig } from "../context";

const tempfile = (directory: string) => pathJoin(directory, ".kivik.tmp");

export const getContainer = async (context: Context) => {
	const tmp = tempfile(context.directory);
	let containerName: string;
	try {
		containerName = await readFile(tmp, { encoding: "utf8" });
	} catch (error) {
		if (error.code === "ENOENT") {
			return null;
		} else {
			throw error;
		}
	}

	const docker = new Docker();

	try {
		const dc = docker.getContainer(containerName);
		const inspect = await dc.inspect();
		const port = parseInt(
			inspect.HostConfig.PortBindings["5984/tcp"][0]["HostPort"],
			10
		);
		return new Container({ dc, port, name: containerName, context });
	} catch (error) {
		if (error.statusCode === 404) {
			await deleteFile(tmp);
			return null;
		} else {
			throw error;
		}
	}
};

export const createContainer = async (
	context: Context,
	instanceConfig: NormalizedInstanceConfig
): Promise<Container> => {
	const { port: desiredPort, image, user, password } = instanceConfig;

	const port = await getPort({ port: desiredPort });

	if (port !== desiredPort) {
		context.log(
			"warn",
			`Port ${desiredPort} unavailable. Docker container will be available at port ${port}.`
		);
	}

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
	await writeFile(tempfile(context.directory), name, { encoding: "utf8" });

	const container = new Container({ dc, port, name, context });
	await container.start();
	return container;
};

interface ContainerArgs {
	readonly dc: Docker.Container;
	readonly port: number;
	readonly name: string;
	readonly context: Context;
}

export class Container {
	private readonly dc: Docker.Container;
	private readonly port: number;
	private readonly name: string;
	readonly nano: ServerScope;
	private readonly context: Context;
	private dockerStream: NodeJS.ReadWriteStream | null;
	private readonly listener: (chunk: any) => void;

	constructor(args: ContainerArgs) {
		this.dc = args.dc;
		this.port = args.port;
		this.name = args.name;
		this.nano = localNano(args.port, args.context.local);
		this.context = args.context;
		this.dockerStream = null;

		this.listener = (chunk) => {
			const lines = (chunk.toString() as string).trim().split("\n");
			for (const line of lines) {
				this.context.log("couch", line);
			}
		};
	}

	async start() {
		this.context.log("info", `Starting container ${this.name}.`);
		await this.dc.start();
		this.context.log("info", `Container ${this.name} started.`);

		const createDb = async (db: string) => {
			return this.nano.relax({ path: db, method: "put", qs: { n: 1 } });
		};

		await pRetry(async () => {
			await createDb("_users");
			await createDb("_replicator");
			await createDb("_global_changes");
		});
	}

	announce() {
		this.context.log(
			"success",
			`Kivik instance ready: http://localhost:${this.port}/_utils`
		);
	}

	async attach() {
		this.dockerStream = await this.dc.attach({
			stream: true,
			stdout: true,
			stderr: true,
			logs: true,
		});
		this.dockerStream.on("data", this.listener);
		this.context.log("info", `Attached to container ${this.name}`);
	}

	detach() {
		if (this.dockerStream) {
			this.dockerStream.off("data", this.listener);
			this.dockerStream = null;
			this.context.log("info", `No longer attached to container ${this.name}.`);
		}
	}

	async stop() {
		const inspect = await this.dc.inspect();
		if (inspect.State.Status) {
			this.detach();
			await this.dc.stop();
			await this.dc.remove();
			await deleteFile(tempfile(this.context.directory));
			this.context.log("warn", `Container ${this.name} stopped and removed.`);
		} else {
			throw new Error(
				"Attempting to stop a Kivik container that is not started."
			);
		}
	}
}
