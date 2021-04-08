import {
	Context,
	defaultContext,
	InstanceConfig,
	NormalizedInstanceConfig,
	normalizeInstanceConfig,
} from "../context";
import { createKivik, DatabaseHandlerMap, Kivik } from "../kivik";
import { getContainer, createContainer, Container } from "./container";

/**
 * Gets a running Kivik instance. Throws an error if the instance cannot be
 * found.
 * @param directory The root directory for the files Kivik will manage.
 * @param config Instance configuration.
 */
export async function getInstance(
	directory: string,
	config?: InstanceConfig
): Promise<Instance>;
/**
 * Gets a running Kivik instance. Throws an error if the instance cannot be
 * found.
 * @param context The Kivik context object to apply to the instance.
 * @param config Instance configuration.
 */
export async function getInstance(
	context: Context,
	config?: InstanceConfig
): Promise<Instance>;
export async function getInstance(
	input: string | Context,
	config: InstanceConfig = {}
): Promise<Instance> {
	const context = typeof input === "string" ? defaultContext(input) : input;
	const container = await getContainer(context);
	if (!container)
		throw new Error(
			"Cannot find a running instance. Check that .kivik.tmp exists and contains the name of a running Docker container."
		);
	const nConfig = normalizeInstanceConfig(
		Object.assign({}, context.local, config)
	);
	return await instanceHelper(container, context, nConfig);
}

/**
 * Creates a Kivik instance.
 * @param directory The root directory for the files Kivik will manage.
 * @param attach Attach to a running instance, if it exists.
 * @param config Instance configuration.
 * @returns The Kivik instance. File scan and load is complete, and the Docker
 * container running the instance's CouchDB endpoint is ready to go.
 */
export async function createInstance(
	directory: string,
	attach?: boolean,
	config?: InstanceConfig
): Promise<Instance>;
/**
 * Creates a Kivik instance.
 * @param context The Kivik context object to apply to the instance.
 * @param attach Attach to a running instance, if it exists.
 * @param config Instance configuration.
 * @returns The Kivik instance. File scan and load is complete, and the Docker
 * container running the instance's CouchDB endpoint is ready to go.
 */
export async function createInstance(
	context: Context,
	attach?: boolean,
	config?: InstanceConfig
): Promise<Instance>;
export async function createInstance(
	input: string | Context,
	attach = true,
	config: InstanceConfig = {}
) {
	const context = typeof input === "string" ? defaultContext(input) : input;

	let instance: Instance | null = null;
	try {
		instance = await getInstance(context, config);
	} catch (_) {}

	if (instance) {
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

	const nConfig = normalizeInstanceConfig(
		Object.assign({}, context.local, config)
	);
	const container = await createContainer(context, nConfig);
	return await instanceHelper(container, context, nConfig);
}

async function instanceHelper(
	container: Container,
	context: Context,
	config: NormalizedInstanceConfig
): Promise<Instance> {
	const nConfig = normalizeInstanceConfig(
		Object.assign({}, context.local, config)
	);

	const kivik = await createKivik(
		context,
		nConfig.fixtures ? "instance" : "deploy"
	);

	return {
		kivik,
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
				fixtures: nConfig.fixtures,
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
	readonly announce: () => void;
	readonly attach: () => Promise<void>;
	readonly deploy: (suffix?: string) => Promise<DatabaseHandlerMap>;
	readonly detach: () => Promise<void>;
	readonly stop: () => Promise<void>;
}
