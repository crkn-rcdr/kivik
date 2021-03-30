import { JsonValue } from "type-fest";
import { MaybeDocument } from "nano";

import { DatabaseContext } from "../context";
import { DesignType, DesignFile } from "./file";

/**
 * A store for design document configuration.
 */
export class DesignDoc {
	/** The name of the design document. */
	readonly name: string;

	private readonly context: DatabaseContext;
	readonly content: Map<DesignType, JsonValue | Map<string, JsonValue>>;

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
			if (file.designType === "lib") {
				// CommonJS modules are parsed as strings and attached to the lib
				// object of this ddoc's views.
				const viewMap = this.getDesignMap("views");
				if (!viewMap.has("lib")) viewMap.set("lib", {});
				(viewMap.get("lib") as Record<string, string>)[
					file.name
				] = file.content as string;
				this.context.log(
					"info",
					`(_design/${this.name}) Updated views/lib/${file.name}.`
				);
			} else {
				const designMap = this.getDesignMap(file.designType);
				designMap.set(file.name, file.serialize());
				this.context.log(
					"info",
					`(_design/${this.name}) Updated ${file.designType}/${file.name}.`
				);
			}
		}
	}

	private getDesignMap(type: DesignType): Map<string, JsonValue> {
		if (!this.content.has(type)) this.content.set(type, new Map());
		return this.content.get(type) as Map<string, JsonValue>;
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
