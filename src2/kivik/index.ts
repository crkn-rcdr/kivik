import { watch, FSWatcher } from "chokidar";
import { join as joinPath } from "path";
import pEvent from "p-event";
import { ServerScope } from "nano";

import { Context, api as apiContext } from "../context";
import { globs as fileGlobs, KivikFile } from "./file";
import { Database } from "./database";
import { Mode } from "..";

export const fromDirectory = (directory: string, mode: Mode = "instance") => {
	return get(apiContext(directory), mode);
};

export const get = async (
	context: Context,
	mode: Mode = "instance"
): Promise<Kivik> => {
	const watcher = watch(fileGlobs(mode), {
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
