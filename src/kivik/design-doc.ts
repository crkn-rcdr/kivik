import { JsonValue as JSONValue } from "type-fest";
import { MaybeDocument } from "nano";

import { DatabaseContext } from "../context";
import { DesignType, DesignFile } from "./file";

export class DesignDoc {
	readonly name: string;
	readonly context: DatabaseContext;
	readonly content: Map<DesignType, JSONValue | Map<string, JSONValue>>;

	constructor(name: string, context: DatabaseContext) {
		this.name = name;
		this.context = context;
		this.content = new Map();
	}

	updateFile(file: DesignFile) {
		if (
			file.designType === "autoupdate" ||
			file.designType === "validate_doc_update"
		) {
			this.content.set(file.designType, file.serialize());
			this.context.log(
				"info",
				`(_design/${this.name}) Updated ${file.designType}.`
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
				`(_design/${this.name}) Updated ${file.designType}/${file.name}.`
			);
		}
	}

	serialize(): MaybeDocument {
		const demappedOnce = Object.fromEntries(this.content);
		const demappedTwice = Object.fromEntries(
			Object.entries(demappedOnce).map(([key, val]) => [
				key,
				val instanceof Map ? Object.fromEntries(val) : val,
			])
		);

		return {
			_id: `_design/${this.name}`,
			...demappedTwice,
		};
	}
}
