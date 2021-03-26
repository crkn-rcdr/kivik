import { DesignType, DesignFile } from "./file";
import { JsonValue as JSONValue } from "type-fest";

export class DesignDoc {
	readonly name: string;
	readonly content: Map<DesignType, JSONValue | Map<string, JSONValue>>;

	constructor(name: string) {
		this.name = name;
		this.content = new Map();
	}

	async updateFile(file: DesignFile) {
		if (
			file.designType === "autoupdate" ||
			file.designType === "validate_doc_update"
		) {
			this.content.set(file.designType, file.serialize());
		} else {
			if (!this.content.has(file.designType))
				this.content.set(file.designType, new Map());
			(this.content.get(file.designType) as Map<string, JSONValue>).set(
				file.name,
				file.serialize()
			);
		}
	}
}
