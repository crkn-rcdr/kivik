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

	context.log("info", "Kivik file scan starting.");

	const iterator = pEvent.iterator(watcher, "add", {
		resolutionEvents: ["ready"],
	});

	for await (const path of iterator) {
		await kivik.updateFile(path);
	}

	context.log("info", "Kivik file scan complete.");

	return kivik;
};

export class Kivik {
	readonly context: Context;
	readonly watcher: FSWatcher;
	readonly databases: Map<string, Database>;
	private nano?: ServerScope;

	constructor(context: Context, watcher: FSWatcher) {
		this.context = context;
		this.watcher = watcher;
		this.databases = new Map();
	}

	watch() {
		this.watcher.on("all", async (listener, path) => {
			try {
				if (["add", "change"].includes(listener)) {
					const tag = listener === "add" ? "new" : "changed";
					this.context.log("success", `Detected ${tag} file: ${path}`);
					await this.updateFile(path);
				} else if (listener === "unlink") {
					this.context.log("success", `Detected deleted file: ${path}`);
					await this.removeFile(path);
				}
			} catch (error) {
				this.context.log("error", error.message);
			}
		});
		this.context.log("success", "Watching Kivik files for updates.");
	}

	async updateFile(path: string) {
		const file = new KivikFile(path, this.context.directory);

		if (!this.databases.has(file.db))
			this.databases.set(
				file.db,
				new Database(file.db, this.context.withDatabase(file.db))
			);

		const database = this.databases.get(file.db) as Database;

		if (this.nano) {
			await database.updateFile(file, this.nano);
		} else {
			await database.updateFile(file);
		}
	}

	async removeFile(path: string) {
		this.context.log("error", `sorry, sorry, I'm trying to remove ${path}`);
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
		this.nano = nano;
	}

	async close() {
		this.context.log("info", "No longer watching Kivik files.");
		this.watcher.close();
	}
}
