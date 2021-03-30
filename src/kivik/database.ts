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
import { DatabaseContext } from "../context";

type Fixture = {
	file: FixtureFile;
	valid: boolean;
};

type IncomingValidateResponse =
	| boolean
	| {
			valid: boolean;
			errors?: any;
	  };

export type ValidateFunction = (doc: MaybeDocument) => IncomingValidateResponse;

export type ValidateResponse = {
	valid: boolean;
	errors?: string;
};

export class Database {
	readonly name: string;
	readonly context: DatabaseContext;
	readonly designDocs: Map<string, DesignDoc>;
	readonly fixtures: Map<string, Fixture>;
	readonly indexes: Map<string, IndexFile>;
	private _validate: ValidateFile | null;

	constructor(name: string, context: DatabaseContext) {
		this.name = name;
		this.context = context;
		this.designDocs = new Map();
		this.fixtures = new Map();
		this.indexes = new Map();
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

	private async updateFixture(file: FixtureFile, nano?: ServerScope) {
		const fixture: Fixture = { file, valid: true };
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

	private updateValidate(file: ValidateFile) {
		this._validate = file;
		this.context.log("info", `Updated the validate function.`);
	}

	async removeFile(_file: KivikFile) {
		// TODO: implement
	}

	canValidate(): boolean {
		return !!this._validate;
	}

	validate(doc: MaybeDocument): ValidateResponse {
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

	private validateFixture(file: FixtureFile): ValidateResponse {
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

	validateFixtures(): Record<string, string> {
		const errors: Record<string, string> = {};
		for (const { file } of this.fixtures.values()) {
			const response = this.validateFixture(file);
			if (!response.valid) {
				errors[file.name] = response.errors || "";
			}
		}
		return errors;
	}

	async deploy(nano: ServerScope, suffix?: string) {
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

		const nanoDb = nano.use(name);

		// Deploy design docs
		if (this.designDocs.size > 0) {
			const ddocs = [...this.designDocs.values()].map((ddoc) =>
				ddoc.serialize()
			);
			await this.deployDocs(nanoDb, ddocs);
			this.context.log("info", `Deployed design documents.`);
		}

		// Validate and deploy fixtures
		if (this.fixtures.size > 0) {
			this.validateFixtures();

			const fixtures = [...this.fixtures.values()]
				.filter((fixture) => fixture.valid)
				.map((fixture) => fixture.file.content as MaybeDocument);

			await this.deployDocs(nanoDb, fixtures);
			this.context.log("info", `Deployed fixtures.`);
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

		this.logDeploySuccess();
	}

	private async deployDoc(nanoDb: DocumentScope<unknown>, doc: MaybeDocument) {
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
	private async deployDocs(
		nanoDb: DocumentScope<unknown>,
		docs: MaybeDocument[]
	) {
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
