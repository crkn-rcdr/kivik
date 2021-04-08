import { ServerScope } from "nano";

import { Context, defaultContext } from "../context";
import { createKivik, DatabaseHandlerMap, Kivik } from "../kivik";
import { getContainer, createContainer, Container } from "./container";

export interface InstanceOptions {
	/**
	 * Whether to attach to a running instance when trying to create one.
	 * Ignored when trying to get a running instance directly.
	 * Default: true
	 */
	attach?: boolean;
	/**
	 * Whether to deploy fixtures to the instance when deploying design
	 * documents. Default: Whatever is set in `local.fixtures` in your RC file.
	 * If that's unset, the default is `true`.
	 */
	fixtures?: boolean;
}

/**
 * Gets a running Kivik instance. Throws an error if the instance cannot be
 * found.
 * @param directory The root directory for the files Kivik will manage.
 */
export async function getInstance(
	directory: string,
	options?: InstanceOptions
): Promise<Instance>;
/**
 * Gets a running Kivik instance. Throws an error if the instance cannot be
 * found.
 * @param context The Kivik context object to apply to the instance.
 */
export async function getInstance(
	context: Context,
	options?: InstanceOptions
): Promise<Instance>;
export async function getInstance(
	input: string | Context,
	options: InstanceOptions = {}
): Promise<Instance> {
	const context = typeof input === "string" ? defaultContext(input) : input;
	const container = await getContainer(context);
	if (!container)
		throw new Error(
			"Cannot find a running instance. Check that .kivik.tmp exists and contains the name of a running Docker container."
		);

	return await instanceHelper(container, context, options);
}

/**
 * Creates a Kivik instance.
 * @param directory The root directory for the files Kivik will manage.
 * @returns The Kivik instance. File scan and load is complete, and the Docker
 * container running the instance's CouchDB endpoint is ready to go.
 */
export async function createInstance(
	directory: string,
	options?: InstanceOptions
): Promise<Instance>;
/**
 * Creates a Kivik instance.
 * @param context The Kivik context object to apply to the instance.
 * @returns The Kivik instance. File scan and load is complete, and the Docker
 * container running the instance's CouchDB endpoint is ready to go.
 */
export async function createInstance(
	context: Context,
	options?: InstanceOptions
): Promise<Instance>;
export async function createInstance(
	input: string | Context,
	options: InstanceOptions = {}
) {
	const context = typeof input === "string" ? defaultContext(input) : input;

	let instance: Instance | null = null;
	try {
		instance = await getInstance(context, options);
	} catch (_) {}

	if (instance) {
		const attach = "attach" in options ? !!options.attach : true;
		if (attach) {
			context.log("success", "Attaching to a running instance.");
			return instance;
		} else {
			throw new Error("Instance already running.");
		}
	} else {
		context.log(
			"info",
			"A running instance was not found. Creating a new one."
		);
	}

	const container = await createContainer(context);
	return await instanceHelper(container, context, options);
}

async function instanceHelper(
	container: Container,
	context: Context,
	options: InstanceOptions
): Promise<Instance> {
	const fixtures =
		"fixtures" in options
			? !!options.fixtures
			: "fixtures" in context.local
			? !!context.local.fixtures
			: true;

	const kivik = await createKivik(context, fixtures ? "instance" : "deploy");

	return {
		kivik,
		nano: container.nano,
		announce: () => {
			container.announce();
		},
		attach: async () => {
			await container.attach();
			kivik.deployOnChanges(container.nano);
		},
		deploy: async (suffix?: string) => {
			return await kivik.deploy({
				nano: container.nano,
				suffix,
				fixtures,
			});
		},
		detach: async () => {
			await kivik.close();
			container.detach();
		},
		stop: async () => {
			await kivik.close();
			await container.stop();
		},
	};
}

export interface Instance {
	readonly kivik: Kivik;
	readonly nano: ServerScope;
	readonly announce: () => void;
	readonly attach: () => Promise<void>;
	readonly deploy: (suffix?: string) => Promise<DatabaseHandlerMap>;
	readonly detach: () => Promise<void>;
	readonly stop: () => Promise<void>;
}
