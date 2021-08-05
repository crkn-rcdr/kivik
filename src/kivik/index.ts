import { watch, FSWatcher } from "chokidar";
import { join as joinPath } from "path";
import pEvent from "p-event";
import pRetry from "p-retry";
import { ServerScope as CouchClient } from "nano";

import { Mode } from "..";
import { Context, defaultContext, NanoDeployment } from "../context";
import { KivikFile } from "./file";
import {
	createDatabase,
	Database,
	DatabaseHandler,
	ValidationReport as DatabaseValidationReport,
} from "./database";

export {
	Database,
	DatabaseHandler,
	ValidationReport as DatabaseValidationReport,
	ValidateFunction as DatabaseValidateFunction,
	ValidateResponse as DatabaseValidateResponse,
} from "./database";

export { ServerScope as CouchClient } from "nano";

export type ValidationReport = Map<string, DatabaseValidationReport>;
export type DatabaseHandlerMap = Map<string, DatabaseHandler<unknown>>;

const fileGlobs = (mode: Mode = "test"): string[] => {
	const validateGlob = ["*/validate.js"];
	const fixtureGlobs = [...validateGlob, "*/fixtures/*.json"];
	const deployGlobs = [
		"*/design/*/lib/*.js",
		"*/design/*/autoupdate.js",
		"*/design/*/validate_doc_update.js",
		"*/design/*/filters/*.js",
		"*/design/*/lists/*.js",
		"*/design/*/shows/*.js",
		"*/design/*/updates/*.js",
		"*/design/*/views/*.js",
		"*/indexes/*.json",
	];

	const globs: Record<Mode, string[]> = {
		test: [...fixtureGlobs, ...deployGlobs],
		deploy: deployGlobs,
		fixtures: fixtureGlobs,
		validate: validateGlob,
	};

	return globs[mode];
};

/**
 * Creates a Kivik store.
 * @param directory The root directory for the files Kivik will manage.
 * @param mode The mode to operate in. Default: `instance`
 * @returns A Kivik object, with initial file scan and load complete.
 */
export async function createKivik(
	directory: string,
	mode?: Mode
): Promise<Kivik>;
/**
 * Creates a Kivik store from a Kivik Context object.
 * @param context The Kivik Context object created from the local environment.
 * @param mode The mode to operate in. Default: `instance`
 * @returns A Kivik object, with initial file scan and load complete.
 */
export async function createKivik(
	context: Context,
	mode?: Mode
): Promise<Kivik>;
export async function createKivik(
	input: string | Context,
	mode: Mode = "test"
): Promise<Kivik> {
	const context = typeof input === "string" ? defaultContext(input) : input;
	const watcher = watch(fileGlobs(mode), {
		cwd: context.directory,
		ignored: [
			...context.excludeDirectories.map((directory) => `${directory}/**`),
			...context.excludeDesign.map((fileglob) => `*/design/*/**/${fileglob}`),
		],
	});

	const kivik = new KivikImpl(context, watcher);

	context.log("info", "Kivik file scan starting.");

	const iterator = pEvent.iterator(watcher, "add", {
		resolutionEvents: ["ready"],
	});

	for await (const path of iterator) {
		await kivik.updateFile(path);
	}

	context.log("info", "Kivik file scan complete.");

	return kivik;
}

/**
 * A store of configuration, fixtures, and validation for a set of CouchDB
 * databases.
 */
export interface Kivik {
	/** Stores for each configured database. */
	readonly databases: Map<string, Database>;

	/**
	 * Updates the Kivik store with a new or changed file.
	 * @param path Path to the file, relative to the root of the Kivik
	 * configuration.
	 * @param nano If set, the CouchDB endpoint that `nano` points to will be
	 * updated with the new file's contents.
	 */
	updateFile: (path: string, nano?: CouchClient) => Promise<void>;

	/**
	 * Removes a file from the Kivik store.
	 * @param path Path to the file, relative to the root of the Kivik
	 * configuration.
	 * @param nano If set, the CouchDB endpoint that `nano` points to will be
	 * updated to no longer contain the file's contents.
	 */
	removeFile: (path: string, nano?: CouchClient) => Promise<void>;

	/**
	 * Validates each fixture against its database's validate function.
	 * @returns A record of each invalid fixture's errors.
	 */
	validateFixtures: () => ValidationReport;

	/**
	 * Deploys stored configuration and fixtures to a CouchDB endpoint,
	 * described by a Kivik RC deployment object.
	 * @param deployment The key of the deployment object in the Kivik RC file.
	 * @returns A Map of each database name to a `nano` `DocumentScope` handler
	 * that permits further operations on it.
	 */
	deploy: (deployment: string | NanoDeployment) => Promise<DatabaseHandlerMap>;

	/**
	 * Deploys stored configuration and fixtures for a single database to a CouchDB
	 * endpoint.
	 */
	deployDb: <D>(args: {
		nano: CouchClient;
		suffix?: string;
		fixtures?: boolean;
		db: string;
	}) => Promise<DatabaseHandler<D>>;

	/**
	 * Returns a function that can deploy a test database to the CouchDB endpoint that
	 * `nano` points to.
	 */
	testDeployer: (
		nano: CouchClient
	) => <D>(db: string, suffix?: string) => Promise<DatabaseHandler<D>>;

	/**
	 * Triggers updates to a CouchDB endpoint when files monitored by the Kivik
	 * store are added, change, or are removed.
	 * @param nano A `nano` instance pointing to the endpoint.
	 */
	deployOnChanges: (nano: CouchClient) => void;

	/**
	 * Closes the watcher monitoring files for this store.
	 */
	close: () => Promise<void>;
}

class KivikImpl implements Kivik {
	readonly databases: Map<string, Database>;

	private readonly context: Context;
	private readonly watcher: FSWatcher;

	constructor(context: Context, watcher: FSWatcher) {
		this.context = context;
		this.watcher = watcher;
		this.databases = new Map();
	}

	async updateFile(path: string, nano?: CouchClient) {
		const file = new KivikFile(path, this.context.directory);

		if (!this.databases.has(file.db))
			this.databases.set(file.db, createDatabase(file.db, this.context));

		const database = this.databases.get(file.db) as Database;

		await database.updateFile(file, nano);
	}

	/** TODO: implement this */
	async removeFile(path: string, _nano?: CouchClient) {
		this.context.log(
			"error",
			`Not yet implemented: deleting ${path} in the Kivik instance`
		);
	}

	validateFixtures(): ValidationReport {
		const errors: ValidationReport = new Map();
		for (const [dbName, db] of this.databases) {
			for (const [fixtureName, errorString] of Object.entries(
				db.validateFixtures()
			)) {
				errors.set(
					`${joinPath(dbName, "fixtures", fixtureName)}.json`,
					errorString
				);
			}
		}
		return errors;
	}

	async deploy(
		deployment: string | NanoDeployment
	): Promise<DatabaseHandlerMap> {
		if (typeof deployment === "string")
			deployment = await this.context.getDeployment(deployment);

		// create system databases if necessary
		const createDb = async (db: string) => {
			return (deployment as NanoDeployment).nano.relax({
				path: db,
				method: "put",
				qs: { n: 1 },
			});
		};

		await pRetry(async () => {
			try {
				await createDb("_users");
				await createDb("_replicator");
				await createDb("_global_changes");
			} catch (e) {
				// 412: db already exists
				if (e.statusCode !== 412) throw e;
			}
		});

		const handlers: DatabaseHandlerMap = new Map();
		for (const [name, db] of this.databases) {
			if (!deployment.dbs || deployment.dbs.includes(name)) {
				handlers.set(name, await db.deploy(deployment));
			}
		}
		return handlers;
	}

	async deployDb<D>(args: {
		nano: CouchClient;
		suffix?: string;
		fixtures?: boolean;
		db: string;
	}) {
		const handlers = await this.deploy({
			nano: args.nano,
			suffix: args.suffix,
			fixtures: args.fixtures ?? false,
			dbs: [args.db],
		});
		if (!handlers.has(args.db))
			throw new Error(`Database '${args.db}' not found.`);
		return handlers.get(args.db) as DatabaseHandler<D>;
	}

	testDeployer(nano: CouchClient) {
		return async <D>(db: string, suffix?: string) => {
			return await this.deployDb<D>({
				nano,
				suffix,
				fixtures: true,
				db,
			});
		};
	}

	deployOnChanges(nano: CouchClient) {
		this.watcher.on("all", async (listener, path) => {
			try {
				if (["add", "change"].includes(listener)) {
					const tag = listener === "add" ? "new" : "changed";
					this.context.log("success", `Detected ${tag} file: ${path}`);
					await this.updateFile(path, nano);
				} else if (listener === "unlink") {
					this.context.log("success", `Detected deleted file: ${path}`);
					await this.removeFile(path, nano);
				}
			} catch (error) {
				this.context.log("error", error.message);
			}
		});
		this.context.log("success", "Watching Kivik files for updates.");
	}

	async close() {
		await this.watcher.close();
		this.context.log("info", "No longer watching Kivik files.");
	}
}
