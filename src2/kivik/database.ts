import { DesignFile, KivikFile, ValidateFile } from "./file";
import { DesignDoc } from "./design-doc";
import { DatabaseContext } from "../context";
import {
	DocumentScope,
	MaybeDocument,
	ServerScope,
	DocumentResponseRow,
} from "nano";

export type Fixture = {
	file: KivikFile;
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
	readonly indexes: Map<string, KivikFile>;
	private _validate: ValidateFile | null;

	constructor(name: string, context: DatabaseContext) {
		this.name = name;
		this.context = context;
		this.designDocs = new Map();
		this.fixtures = new Map();
		this.indexes = new Map();
		this._validate = null;
	}

	updateFile(file: KivikFile) {
		if (file.fileType === "design") {
			this.updateDesignDoc(file as DesignFile);
		} else if (file.fileType === "fixture") {
			this.updateFixture(file);
		} else if (file.fileType === "index") {
			this.updateIndex(file);
		} else if (file.fileType === "validate") {
			this.updateValidate(file as ValidateFile);
		}
	}

	private updateDesignDoc(file: DesignFile) {
		if (!this.designDocs.has(file.ddoc))
			this.designDocs.set(file.ddoc, new DesignDoc(file.ddoc, this.context));
		const designDoc = this.designDocs.get(file.ddoc) as DesignDoc;
		designDoc.updateFile(file);
	}

	private updateFixture(file: KivikFile) {
		this.fixtures.set(file.name, { file, valid: true });
		this.context.log("info", `Updated fixture ${file.name}.`);
	}

	private updateIndex(file: KivikFile) {
		const index = file.content as Record<string, unknown>;
		if (!index["name"]) index["name"] = file.name;
		if (!index["ddoc"]) index["ddoc"] = `index_${file.name}`;
		this.indexes.set(file.name, file);
		this.context.log("info", `Updated index ${file.name}.`);
	}

	private updateValidate(file: ValidateFile) {
		this._validate = file;
		this.context.log("info", `Updated the validate function.`);
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

	validateFixtures(): Record<string, string> {
		const errors: Record<string, string> = {};
		for (const [name, { file }] of this.fixtures.entries()) {
			const response = this.validate(file.content as MaybeDocument);
			if (!response.valid) {
				errors[name] = response.errors || "";
			}
			this.fixtures.set(name, { file, valid: response.valid });
		}
		return errors;
	}

	async deploy(nano: ServerScope) {
		// Create database if it doesn't exist
		let dbExists = true;
		try {
			await nano.db.get(this.name);
		} catch (error) {
			if (!(error.message === "no_db_file")) {
				dbExists = false;
			} else {
				throw error;
			}
		}
		if (!dbExists) await nano.db.create(this.name);

		const nanoDb = nano.use(this.name);

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
			const errors = this.validateFixtures();
			for (const [name, errorString] of Object.entries(errors)) {
				this.context.log(
					"warn",
					`Fixture ${name} is invalid. Errors: ${errorString}`
				);
			}

			const fixtures = [...this.fixtures.values()]
				.filter((fixture) => fixture.valid)
				.map((fixture) => fixture.file.content as MaybeDocument);

			await this.deployDocs(nanoDb, fixtures);
			this.context.log("info", `Deployed fixtures.`);
		}

		// Deploy indexes
		if (this.indexes.size > 0) {
			const indexes = [...this.indexes.values()].map((index) => index.content);

			await Promise.all(
				indexes.map(async (index) => {
					nano.relax({
						db: this.name,
						path: "/_index",
						method: "post",
						body: index,
					});
				})
			);
			this.context.log("info", "Deployed indexes.");
		}
	}

	private async deployDocs(
		nanoDb: DocumentScope<unknown>,
		docs: MaybeDocument[]
	) {
		const keys = docs
			.map((doc) => doc._id)
			.filter((id) => typeof id === "string") as string[];

		const response = await nanoDb.fetch({ keys });
		const goodRows = response.rows.filter(
			(row) => !row.error
		) as DocumentResponseRow<unknown>[];

		const revs = Object.fromEntries(
			goodRows.map((row) => [row.id, row.value.rev])
		);

		await nanoDb.bulk({
			docs: docs.map((doc) => {
				if (doc._id && revs[doc._id]) {
					return { ...doc, _rev: revs[doc._id] };
				} else {
					return doc;
				}
			}),
		});
	}
}
