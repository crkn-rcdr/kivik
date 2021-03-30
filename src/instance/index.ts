import { ServerScope } from "nano";
import {
	Context,
	apiContext,
	InstanceConfig,
	normalizeInstanceConfig,
} from "../context";
import { createKivikFromContext, DatabaseHandlerMap, Kivik } from "../kivik";
import { createContainer } from "./container";

/**
 * Creates a Kivik instance.
 * @param directory The root directory for the files Kivik will manage.
 * @returns The Kivik instance. File scan and load is complete, and the Docker
 * container running the instance's CouchDB endpoint is ready to go.
 */
export const createInstance = (
	directory: string,
	instanceConfig: InstanceConfig = {}
) => {
	return createInstanceFromContext(apiContext(directory), instanceConfig);
};

export const createInstanceFromContext = async (
	context: Context,
	instanceConfig: InstanceConfig = {}
): Promise<Instance> => {
	const normalizedInstanceConfig = normalizeInstanceConfig(
		Object.assign({}, context.rc.local, instanceConfig)
	);
	const kivik = await createKivikFromContext(
		context,
		normalizedInstanceConfig.fixtures ? "instance" : "deploy"
	);

	const container = await createContainer(context, normalizedInstanceConfig);

	await container.start();
	kivik.deployOnChanges(container.nano);

	return {
		kivik,
		nano: container.nano,
		deploy: (suffix?: string) => {
			return kivik.deploy(container.nano, suffix);
		},
		stop: async () => {
			await kivik.close();
			await container.stop();
		},
	};
};

export interface Instance {
	readonly kivik: Kivik;
	readonly nano: ServerScope;
	readonly deploy: (suffix?: string) => Promise<DatabaseHandlerMap>;
	readonly stop: () => Promise<void>;
}
