import { DesignType, DesignFile } from "./file";
import { JsonValue as JSONValue } from "type-fest";
import { DatabaseContext } from "../context";

export class DesignDoc {
	readonly name: string;
	readonly context: DatabaseContext;
	readonly content: Map<DesignType, JSONValue | Map<string, JSONValue>>;

	constructor(name: string, context: DatabaseContext) {
		this.name = name;
		this.context = context;
		this.content = new Map();
	}

	async updateFile(file: DesignFile) {
		if (
			file.designType === "autoupdate" ||
			file.designType === "validate_doc_update"
		) {
			this.content.set(file.designType, file.serialize());
			this.context.log(
				"info",
				`Updated ${file.designType} in db: ${this.context.database}, ddoc: ${this.name}`
			);
		} else {
			if (!this.content.has(file.designType))
				this.content.set(file.designType, new Map());
			(this.content.get(file.designType) as Map<string, JSONValue>).set(
				file.name,
				file.serialize()
			);
			this.context.log(
				"info",
				`Updated ${file.designType}/${file.name} in db: ${this.context.database}, ddoc: ${this.name}`
			);
		}
	}
}
