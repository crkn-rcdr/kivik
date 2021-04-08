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
		Object.assign({}, context.local, instanceConfig)
	);
	const kivik = await createKivikFromContext(
		context,
		normalizedInstanceConfig.fixtures ? "instance" : "deploy"
	);

	const container = await createContainer(context, normalizedInstanceConfig);

	kivik.deployOnChanges(container.nano);

	return {
		kivik,
		attach: async () => {
			await container.attach();
		},
		deploy: (suffix?: string) => {
			return kivik.deploy(container.nano, suffix);
		},
		detach: () => {
			container.detach();
		},
		stop: async () => {
			await kivik.close();
			await container.stop();
		},
	};
};

export interface Instance {
	readonly kivik: Kivik;
	readonly attach: () => Promise<void>;
	readonly deploy: (suffix?: string) => Promise<DatabaseHandlerMap>;
	readonly detach: () => void;
	readonly stop: () => Promise<void>;
}
