import { DesignFile, KivikFile, ValidateFile } from "./file";
import { DesignDoc } from "./design-doc";
import { Context } from "../context";
import { MaybeDocument } from "nano";

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
	readonly context: Context;
	readonly designDocs: Map<string, DesignDoc>;
	readonly fixtures: Map<string, Fixture>;
	readonly indexes: Map<string, KivikFile>;
	private _validate: ValidateFile | null;

	constructor(name: string, context: Context) {
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
			this.designDocs.set(file.ddoc, new DesignDoc(file.ddoc));
		const designDoc = this.designDocs.get(file.ddoc) as DesignDoc;
		designDoc.updateFile(file);
	}

	private updateFixture(file: KivikFile) {
		this.fixtures.set(file.name, { file, valid: true });
	}

	private updateIndex(file: KivikFile) {
		const index = file.content as Record<string, unknown>;
		if (!index["name"]) index["name"] = file.name;
		if (!index["ddoc"]) index["ddoc"] = `index_${file.name}`;
		this.indexes.set(file.name, file);
	}

	private updateValidate(file: ValidateFile) {
		this._validate = file;
	}

	canValidate(): boolean {
		return !!this._validate;
	}

	validate(doc: MaybeDocument): ValidateResponse {
		if (this._validate) {
			const validateFunc = this._validate.content as ValidateFunction;
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
}
