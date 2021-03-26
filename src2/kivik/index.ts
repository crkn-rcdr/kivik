import { watch, FSWatcher } from "chokidar";
import { join as joinPath } from "path";
import pEvent from "p-event";
import { Context } from "../context";
import { GlobMode, globs as fileGlobs, KivikFile } from "./file";
import { Database } from "./database";
import { ServerScope } from "nano";

export const get = async (
	context: Context,
	globMode: GlobMode = "all"
): Promise<Kivik> => {
	const watcher = watch(fileGlobs(globMode), {
		cwd: context.directory,
		ignored: [
			...context.rc.excludeDirectories.map((directory) => `${directory}/**`),
			...context.rc.excludeDesign.map(
				(fileglob) => `*/design/*/**/${fileglob}`
			),
		],
	});

	const kivik = new Kivik(context, watcher);

	const iterator = pEvent.iterator<"add", string>(watcher, "add", {
		resolutionEvents: ["ready"],
	});

	for await (const path of iterator) {
		kivik.updateFile(path);
	}

	return kivik;
};

export class Kivik {
	readonly context: Context;
	readonly watcher: FSWatcher;
	readonly databases: Map<string, Database>;

	constructor(context: Context, watcher: FSWatcher) {
		this.context = context;
		this.watcher = watcher;
		this.databases = new Map();
	}

	updateFile(path: string) {
		const file = new KivikFile(path, this.context.directory);

		if (!this.databases.has(file.db))
			this.databases.set(
				file.db,
				new Database(file.db, this.context.withDatabase(file.db))
			);

		const database = this.databases.get(file.db) as Database;
		database.updateFile(file);
	}

	validateFixtures(): Record<string, string> {
		const errors: Record<string, string> = {};
		for (const [dbName, db] of this.databases) {
			for (const [fixtureName, errorString] of Object.entries(
				db.validateFixtures()
			)) {
				errors[
					`${joinPath(dbName, "fixtures", fixtureName)}.json`
				] = errorString;
			}
		}
		return errors;
	}

	async deploy(nano: ServerScope) {
		await Promise.all(
			[...this.databases.values()].map((db) => db.deploy(nano))
		);
		this.context.log("success", "Deployment successful.");
	}

	async close() {
		this.watcher.close();
	}
}
