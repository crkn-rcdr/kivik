import { readJSONSync as readJSON } from "fs-extra";
import {
	sep as pathSeparator,
	join as joinPath,
	basename,
	extname,
} from "path";
import { JsonObject as JSONObject, JsonValue as JSONValue } from "type-fest";

export const globs = [
	"*/design/*/autoupdate.js",
	"*/design/*/validate_doc_update.js",
	"*/design/*/filters/*.js",
	"*/design/*/lists/*.js",
	"*/design/*/shows/*.js",
	"*/design/*/updates/*.js",
	"*/design/*/views/*.js",
	"*/fixtures/*.json",
	"*/indexes/*.json",
	"*/validate.js",
];

type Root = "design" | "fixtures" | "indexes" | "validate.js";
export type FileType = "design" | "fixture" | "index" | "validate";
export type DesignType =
	| "autoupdate"
	| "validate_doc_update"
	| "filters"
	| "lists"
	| "shows"
	| "updates"
	| "views";
type FileExtension = ".js" | ".json";
type FileContentType = "boolean" | "function" | "object" | "viewObject";
type FileContent =
	| boolean
	| ((...args: unknown[]) => unknown)
	| Record<string, unknown>;

const fileTypes: Record<Root, FileType> = {
	design: "design",
	fixtures: "fixture",
	indexes: "index",
	"validate.js": "validate",
};

const contentTypes: Record<FileType, FileContentType> = {
	design: "object",
	fixture: "object",
	index: "object",
	validate: "function",
};

const designContentTypes: Record<DesignType, FileContentType> = {
	autoupdate: "boolean",
	validate_doc_update: "function",
	filters: "function",
	lists: "function",
	shows: "function",
	updates: "function",
	views: "object",
};

export class KivikFile {
	readonly path: string;
	readonly db: string;
	readonly fileType: FileType;
	readonly ddoc?: string;
	readonly designType?: DesignType;
	readonly name: string;
	readonly extension: FileExtension;
	content: FileContent = false;

	constructor(path: string, wd: string) {
		const [db, first, ...rest] = path.split(pathSeparator) as [
			string,
			Root,
			...string[]
		];
		this.path = joinPath(wd, path);
		this.db = db;
		this.fileType = fileTypes[first];
		this.extension = extname(path) as FileExtension;
		this.name = basename(path, this.extension);

		if (this.fileType === "design") {
			const [ddoc, dtype] = rest as [string, string];
			this.ddoc = ddoc;
			this.designType = basename(dtype, this.extension) as DesignType;
		}

		const contentType =
			this.fileType === "design"
				? designContentTypes[this.designType as DesignType]
				: contentTypes[this.fileType];
		const content =
			this.extension === ".js" ? require(this.path) : readJSON(this.path);
		if (typeof content !== contentType)
			throw new TypeError(`Expecting ${contentType} at ${this.path}`);
		this.content = content;
	}

	serialize(): JSONValue {
		if (typeof this.content === "function") {
			return this.content.toString();
		} else if (this.designType === "views") {
			return Object.fromEntries(
				Object.entries(
					this.content as Record<string, unknown>
				).map(([key, value]) => [
					key,
					typeof value === "function" ? value.toString() : value,
				])
			) as JSONObject;
		} else {
			return this.content as boolean | JSONObject;
		}
	}
}

export type DesignFile = Required<KivikFile> & { fileType: "design" };
