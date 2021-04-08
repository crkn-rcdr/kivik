import {
	DocumentScope,
	MaybeDocument,
	ServerScope,
	DocumentResponseRow,
	CreateIndexRequest,
} from "nano";

import {
	KivikFile,
	DesignFile,
	isDesignFile,
	FixtureFile,
	isFixtureFile,
	IndexFile,
	isIndexFile,
	ValidateFile,
	isValidateFile,
} from "./file";
import { DesignDoc } from "./design-doc";
import { Context, DatabaseContext, NanoDeployment } from "../context";

/** A `nano` DocumentScope object pointing to the deployed database. */
export type DatabaseHandler = DocumentScope<unknown>;

/** A map between invalid fixtures and their validation errors. */
export type ValidationReport = Map<string, string>;

type FixtureRecord = {
	file: FixtureFile;
	valid: boolean;
};

/**
 * Output of a ValidateFunction. This can either be a boolean representing
 * the document's validity, or an object that also provides validation error
 * data.
 */
export type ValidateResponse =
	| boolean
	| {
			/** Is the document valid? */
			valid: boolean;
			/** Validation errors. These will be passed through JSON.stringify
			 * when the ValidateFunction is called by Kivik.
			 */
			errors?: any;
	  };

/** A function that can be used by Kivik to validate database documents. */
export type ValidateFunction = (doc: MaybeDocument) => ValidateResponse;

/** The response returned when validating a document against a database. */
export type NormalizedValidateResponse = {
	/** Is the document valid? */
	valid: boolean;
	/** String describing validation errors that have taken place. */
	errors?: string;
};

/**
 * A store for database configuration, fixtures, and validation.
 */
export interface Database {
	/**
	 * The name of the directory containing this database's Kivik configuration,
	 * which is used as the identifier of the database in CouchDB.
	 */
	readonly name: string;

	/**
	 * Design documents for this database.
	 */
	readonly designDocs: Map<string, DesignDoc>;

	/**
	 * Mango index configuration for this database.
	 */
	readonly indexes: Map<string, IndexFile>;

	/**
	 * Database fixtures, for use in development and testing.
	 */
	readonly fixtures: Map<string, FixtureRecord>;

	/**
	 * Updates the database store with a new or changed file.
	 * @param file A Kivik file handle.
	 * @param nano If set, changes made by the updated file will be deployed
	 * to the CouchDB endpoint managed by this `nano` instance.
	 */
	updateFile: (file: KivikFile, nano?: ServerScope) => Promise<void>;

	/**
	 * Removes a file from the database store.
	 * @param file A Kivik file handle.
	 * @param nano If set, the contents of the file will be deleted from the
	 * CouchDB endpoint managed by this `nano` instance.
	 */
	removeFile: (file: KivikFile, nano?: ServerScope) => Promise<void>;

	/**
	 * Has this database been provided a validate function?
	 */
	canValidate: () => boolean;

	/**
	 * Validate a document against this database's validate function. If no
	 * validate function has been provided, the document will be considered
	 * valid by default.
	 * @param doc A CouchDB document.
	 * @returns An object whose `valid` property represents whether the document
	 * is valid, and whose `errors` property contains any errors reported by
	 * the validate function.
	 */
	validate: (doc: MaybeDocument) => NormalizedValidateResponse;

	/**
	 * Validate every fixture against the database's validate function.
	 * @returns A record of the validation errors for any invalid fixture.
	 */
	validateFixtures: () => ValidationReport;

	/**
	 * Deploy the database's configuration and fixtures.
	 * @param deployment A NanoDeployment object containing information required
	 * for the task.
	 * @returns A promise resolving to a `nano` DocumentScope instance which
	 * can perform further operations on database documents.
	 */
	deploy: (deployment: NanoDeployment) => Promise<DatabaseHandler>;
}

/**
 * Create a database store.
 * @param name The name of the database.
 * @param context The Kivik Context.
 */
export const createDatabase = (name: string, context: Context): Database => {
	return new DatabaseImpl(name, context);
};

class DatabaseImpl implements Database {
	readonly name: string;
	readonly designDocs: Map<string, DesignDoc>;
	readonly indexes: Map<string, IndexFile>;
	readonly fixtures: Map<string, FixtureRecord>;

	private readonly context: DatabaseContext;
	private _validate: ValidateFile | null;

	constructor(name: string, context: Context) {
		this.name = name;
		this.context = context.withDatabase(name);
		this.designDocs = new Map();
		this.indexes = new Map();
		this.fixtures = new Map();
		this._validate = null;
	}

	async updateFile(file: KivikFile, nano?: ServerScope) {
		if (isDesignFile(file)) {
			await this.updateDesignDoc(file, nano);
		} else if (isFixtureFile(file)) {
			await this.updateFixture(file, nano);
		} else if (isIndexFile(file)) {
			await this.updateIndex(file, nano);
		} else if (isValidateFile(file)) {
			this.updateValidate(file);
			if (nano) {
				this.context.log(
					"success",
					"Future fixture file changes will be validated against the new function."
				);
			}
		}
	}

	private async updateDesignDoc(file: DesignFile, nano?: ServerScope) {
		if (!this.designDocs.has(file.ddoc))
			this.designDocs.set(file.ddoc, new DesignDoc(file.ddoc, this.context));
		const designDoc = this.designDocs.get(file.ddoc) as DesignDoc;
		designDoc.updateFile(file);

		if (nano) {
			this.logDeployAttempt(`_design/${file.ddoc}`);
			await this.deployDoc(nano.use(this.name), designDoc.serialize());
			this.logDeploySuccess();
		}
	}

	private async updateIndex(file: IndexFile, nano?: ServerScope) {
		const index = file.content;
		if (!index.name) index.name = file.name;
		if (!index.ddoc) index.ddoc = `index_${file.name}`;
		this.indexes.set(file.name, file);
		this.context.log("info", `Updated index ${file.name}.`);

		if (nano) {
			this.context.log("warn", `Deploying index ${file.name}.`);
			await this.deployIndex(nano, this.name, index);
			this.context.log("success", `Deployment successful.`);
		}
	}

	private async updateFixture(file: FixtureFile, nano?: ServerScope) {
		const fixture: FixtureRecord = { file, valid: true };
		this.fixtures.set(file.name, fixture);
		this.context.log("info", `Updated fixture ${file.name}.`);

		if (nano) {
			const response = this.validateFixture(fixture.file);
			if (response.valid) {
				this.logDeployAttempt(`fixture ${fixture.file.name}`);
				await this.deployDoc(nano.use(this.name), fixture.file.content);
				this.logDeploySuccess();
			}
		}
	}

	private updateValidate(file: ValidateFile) {
		this._validate = file;
		this.context.log("info", `Updated the validate function.`);
	}

	/** TODO: implement this */
	async removeFile(_file: KivikFile) {}

	canValidate(): boolean {
		return !!this._validate;
	}

	validate(doc: MaybeDocument): NormalizedValidateResponse {
		if (this._validate) {
			const validateFunc = this._validate.content;
			const response = validateFunc(doc);
			if (typeof response === "boolean") {
				return { valid: response };
			} else {
				response.errors = JSON.stringify(response.errors, null, 2);
				return response;
			}
		}
		return { valid: true };
	}

	private validateFixture(file: FixtureFile): NormalizedValidateResponse {
		const response = this.validate(file.content);
		this.fixtures.set(file.name, { file, valid: response.valid });
		if (!response.valid) {
			this.context.log(
				"warn",
				`Fixture ${file.name} is invalid. Errors: ${response.errors}`
			);
		}
		return response;
	}

	validateFixtures(): ValidationReport {
		const errors = new Map();
		for (const { file } of this.fixtures.values()) {
			const response = this.validateFixture(file);
			errors.set(file.name, response.errors || "");
		}
		return errors;
	}

	async deploy(deployment: NanoDeployment): Promise<DatabaseHandler> {
		const { nano, suffix, fixtures } = deployment;
		const name = suffix ? `${this.name}-${suffix}` : this.name;
		this.logDeployAttempt(suffix ? `database (${name})` : "database");

		// Create database if it doesn't exist
		let dbExists = true;
		try {
			await nano.db.get(name);
		} catch (error) {
			if (!(error.message === "no_db_file")) {
				dbExists = false;
			} else {
				throw error;
			}
		}
		if (!dbExists) await nano.db.create(name);

		const nanoDb = nano.use(name) as DatabaseHandler;

		// Deploy design docs
		if (this.designDocs.size > 0) {
			const ddocs = [...this.designDocs.values()].map((ddoc) =>
				ddoc.serialize()
			);
			await this.deployDocs(nanoDb, ddocs);
			this.context.log("info", `Deployed design documents.`);
		}

		// Deploy indexes
		if (this.indexes.size > 0) {
			await Promise.all(
				[...this.indexes.values()].map(async (index) =>
					this.deployIndex(nano, name, index.content)
				)
			);
			this.context.log("info", "Deployed indexes.");
		}

		// Validate and deploy fixtures
		if (fixtures && this.fixtures.size > 0) {
			this.validateFixtures();

			const fixtures = [...this.fixtures.values()]
				.filter((fixture) => fixture.valid)
				.map((fixture) => fixture.file.content);

			await this.deployDocs(nanoDb, fixtures);
			this.context.log("info", `Deployed fixtures.`);
		}

		this.logDeploySuccess();

		return nanoDb;
	}

	private async deployDoc(nanoDb: DatabaseHandler, doc: MaybeDocument) {
		let _rev: string = "";
		try {
			if (doc._id) {
				// for whatever reason the etag header's contents are double-quoted
				_rev = JSON.parse((await nanoDb.head(doc._id)).etag);
			}
		} catch (error) {
			if (error.statusCode !== 404) throw error;
		}

		doc = _rev ? { ...doc, _rev } : doc;
		await nanoDb.insert(doc);
	}

	private async deployIndex(
		nano: ServerScope,
		dbName: string,
		index: CreateIndexRequest
	) {
		nano.relax({
			db: dbName,
			path: "_index",
			method: "post",
			body: index,
		});
	}

	/**
	 * Use CouchDB's bulk API to deploy a series of documents to the database.
	 * Useful for full deployments.
	 * @param nanoDb Document-scoped nano instance. e.g. `nano.use(this.name)`.
	 * @param docs Array of documents to deploy.
	 */
	private async deployDocs(nanoDb: DatabaseHandler, docs: MaybeDocument[]) {
		const keys = docs
			.map((doc) => doc._id)
			.filter((id) => typeof id === "string") as string[];

		const keyResponse = await nanoDb.fetch({ keys });
		const goodRows = keyResponse.rows.filter(
			(row) => !row.error
		) as DocumentResponseRow<unknown>[];

		const revs = Object.fromEntries(
			goodRows.map((row) => [row.id, row.value.rev])
		);

		const bulkResponse = await nanoDb.bulk({
			docs: docs.map((doc) => {
				if (doc._id && revs[doc._id]) {
					return { ...doc, _rev: revs[doc._id] };
				} else {
					return doc;
				}
			}),
		});

		for (const row of bulkResponse.filter((row) => row.error)) {
			this.context.log(
				"error",
				`Error inserting document ${row.id}: ${row.reason}`
			);
		}
	}

	private logDeployAttempt(deployObject: string) {
		this.context.log("warn", `Deploying ${deployObject}.`);
	}

	private logDeploySuccess() {
		this.context.log("success", "Deployment successful.");
	}
}
