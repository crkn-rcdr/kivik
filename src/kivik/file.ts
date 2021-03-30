import { readJSONSync as readJSON, readFileSync as readFile } from "fs-extra";
import { CreateIndexRequest, MaybeDocument } from "nano";
import {
	sep as pathSeparator,
	join as joinPath,
	basename,
	extname,
} from "path";
import { JsonObject as JSONObject, JsonValue as JSONValue } from "type-fest";

import { Mode } from "..";
import { ValidateFunction } from "./database";

export const globs = (mode: Mode = "instance"): string[] => {
	const validateGlob = ["*/validate.js"];
	const fixtureGlobs = [...validateGlob, "*/fixtures/*.json"];
	const deployGlobs = [
		"*/design/*/lib/*.js",
		"*/design/*/autoupdate.js",
		"*/design/*/validate_doc_update.js",
		"*/design/*/filters/*.js",
		"*/design/*/lists/*.js",
		"*/design/*/shows/*.js",
		"*/design/*/updates/*.js",
		"*/design/*/views/*.js",
		"*/indexes/*.json",
	];

	const globs: Record<Mode, string[]> = {
		instance: [...fixtureGlobs, ...deployGlobs],
		deploy: deployGlobs,
		fixtures: fixtureGlobs,
		validate: validateGlob,
	};

	return globs[mode];
};

type Root = "design" | "fixtures" | "indexes" | "validate.js";

export type FileType = "design" | "fixture" | "index" | "validate";

export type DesignType =
	| "lib"
	| "autoupdate"
	| "validate_doc_update"
	| "filters"
	| "lists"
	| "shows"
	| "updates"
	| "views";

type FileExtension = ".js" | ".json";

type FileContentType = "boolean" | "function" | "object" | "string";

type FileContent =
	| null // unset because the file might not exist
	| boolean // design: autoupdate
	| ((...args: unknown[]) => unknown) // one of the many possible design functions
	| Record<string, unknown> // views
	| string // lib. we don't actually want to require the content of a lib file
	| MaybeDocument // fixture
	| CreateIndexRequest // index
	| ValidateFunction; // validate

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
	lib: "string",
	autoupdate: "boolean",
	validate_doc_update: "function",
	filters: "function",
	lists: "function",
	shows: "function",
	updates: "function",
	views: "object",
};

/**
 * Invalidates the require cache for this module and requires it.
 * @param module A resolvable module path.
 * @returns The newly-required module.
 */
const rerequire = (module: string): any => {
	delete require.cache[require.resolve(module)];
	return require(module);
};

export class KivikFile {
	readonly path: string;
	readonly db: string;
	readonly fileType: FileType;
	readonly ddoc?: string;
	readonly designType?: DesignType;
	readonly name: string;
	readonly extension: FileExtension;
	readonly content: FileContent;

	constructor(path: string, wd: string, load = true) {
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

		if (load) {
			const contentType =
				this.fileType === "design"
					? designContentTypes[this.designType as DesignType]
					: contentTypes[this.fileType];

			const content =
				contentType === "string"
					? readFile(this.path, { encoding: "utf8" })
					: this.extension === ".js"
					? rerequire(this.path)
					: readJSON(this.path);

			// Some very basic validation
			if (typeof content !== contentType)
				throw new TypeError(`Expecting ${contentType} at ${this.path}`);

			this.content = content;

			// Fixtures from existing databases may have no-longer-valid CouchDB revisions
			if (isFixtureFile(this)) delete this.content["_rev"];
		} else {
			this.content = null;
		}
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

export type DesignFile = Omit<Required<KivikFile>, "fileType"> & {
	fileType: "design";
};

export const isDesignFile = (file: KivikFile): file is DesignFile => {
	return file.fileType === "design";
};

export type FixtureFile = Omit<KivikFile, "fileType" | "content"> & {
	fileType: "fixture";
	content: MaybeDocument;
};

export const isFixtureFile = (file: KivikFile): file is FixtureFile => {
	return file.fileType === "fixture" && typeof file.content === "object";
};

export type IndexFile = Omit<KivikFile, "fileType" | "content"> & {
	fileType: "index";
	content: CreateIndexRequest;
};

export const isIndexFile = (file: KivikFile): file is IndexFile => {
	const content = file.content as CreateIndexRequest;
	return (
		file.fileType === "index" &&
		typeof content === "object" &&
		typeof content.index === "object" &&
		content.index.hasOwnProperty("fields")
	);
};

export type ValidateFile = Omit<KivikFile, "fileType" | "content"> & {
	fileType: "validate";
	content: ValidateFunction;
};

export const isValidateFile = (file: KivikFile): file is ValidateFile => {
	return file.fileType === "validate" && typeof file.content === "function";
};
