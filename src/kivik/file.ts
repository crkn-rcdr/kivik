import { readJsonSync, readFileSync } from "fs-extra";
import { CreateIndexRequest, MaybeDocument } from "nano";
import {
	sep as pathSeparator,
	join as joinPath,
	basename,
	extname,
} from "path";
import { JsonObject, JsonValue } from "type-fest";

import { ValidateFunction } from "./database";

type Root = "design" | "fixtures" | "indexes" | "validate.js";

type FileType = "design" | "fixture" | "index" | "validate";

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

/**
 * Content of and information about a Kivik file.
 */
export class KivikFile {
	/** The file's absolute path. */
	readonly path: string;
	/** The database the file belongs to. */
	readonly db: string;
	/** The file's type. */
	readonly fileType: FileType;
	/** The file's design document, if it belongs to one. */
	readonly ddoc?: string;
	/** The type of design file this is, if it is one. */
	readonly designType?: DesignType;
	/** The file's name, used to index it in the database store. */
	readonly name: string;
	/** The file's content. */
	readonly content: FileContent;

	/**
	 * Creates a Kivik file record.
	 * @param path Path to the file, relative to `wd`.
	 * @param wd The working Kivik directory.
	 * @param load Should the file's contents be loaded?
	 */
	constructor(path: string, wd: string, load = true) {
		const [db, first, ...rest] = path.split(pathSeparator) as [
			string,
			Root,
			...string[]
		];
		this.path = joinPath(wd, path);
		this.db = db;
		this.fileType = fileTypes[first];

		const extension = extname(path) as FileExtension;
		this.name = basename(path, extension);

		if (this.fileType === "design") {
			const [ddoc, dtype] = rest as [string, string];
			this.ddoc = ddoc;
			this.designType = basename(dtype, extension) as DesignType;
		}

		if (load) {
			const contentType =
				this.fileType === "design"
					? designContentTypes[this.designType as DesignType]
					: contentTypes[this.fileType];

			const content =
				contentType === "string"
					? readFileSync(this.path, { encoding: "utf8" })
					: extension === ".js"
					? rerequire(this.path)
					: readJsonSync(this.path);

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

	/**
	 * The file's content, serialized into something JSON can handle.
	 */
	serialize(): JsonValue {
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
			) as JsonObject;
		} else {
			return this.content as boolean | JsonObject;
		}
	}
}

/**
 * Part of a design document.
 */
export type DesignFile = Omit<Required<KivikFile>, "fileType"> & {
	fileType: "design";
};

/**
 * Is this file part of a design document?
 */
export const isDesignFile = (file: KivikFile): file is DesignFile => {
	return file.fileType === "design";
};

/**
 * Test data used in development and testing.
 */
export type FixtureFile = Omit<KivikFile, "fileType" | "content"> & {
	fileType: "fixture";
	content: MaybeDocument;
};

/**
 * Is this file a fixture?
 */
export const isFixtureFile = (file: KivikFile): file is FixtureFile => {
	return file.fileType === "fixture" && typeof file.content === "object";
};

/**
 * Configuration setting up a Mango index.
 */
export type IndexFile = Omit<KivikFile, "fileType" | "content"> & {
	fileType: "index";
	content: CreateIndexRequest;
};

/**
 * Is this file Mango index configuration?
 */
export const isIndexFile = (file: KivikFile): file is IndexFile => {
	const content = file.content as CreateIndexRequest;
	return (
		file.fileType === "index" &&
		typeof content === "object" &&
		typeof content.index === "object" &&
		content.index.hasOwnProperty("fields")
	);
};

/**
 * A file exporting a validate function.
 */
export type ValidateFile = Omit<KivikFile, "fileType" | "content"> & {
	fileType: "validate";
	content: ValidateFunction;
};

/**
 * Does this file export a validate function (or, at least, any function at
 * all)?
 */
export const isValidateFile = (file: KivikFile): file is ValidateFile => {
	return file.fileType === "validate" && typeof file.content === "function";
};
