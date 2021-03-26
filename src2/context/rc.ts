/**
 * Configuration for deploying design documents to a CouchDB endpoint.
 */
export interface Deployment {
	/** CouchDB endpoint URL */
	url: string;
	/** Authentication credentials (basic only, for now) */
	auth?: {
		/** CouchDB username */
		user: string;
		/** `user`'s password */
		password: string;
	};
}

/** Configuration for local, ephemeral Kivik containers */
interface LocalConfig {
	/** Deploy fixtures when running `kivik dev`. Default: `true` */
	fixtures?: boolean;
	/** CouchDB docker image tag. Default: `couchdb:3.1` */
	image?: string;
	/** Port that Kivik will attempt to run a `kivik dev` instance on. Default: `5984` */
	port?: number;
	/** CouchDB admin user */
	user?: string;
	/** CouchDB admin user's password */
	password?: string;
}

export type NormalizedLocalConfig = Required<LocalConfig>;

/**
 * Normalize a LocalConfig object with defaults.
 */
export const normalizeLocalConfig = (c: LocalConfig): NormalizedLocalConfig => {
	return {
		fixtures: typeof c.fixtures === "boolean" ? c.fixtures : true,
		image: c.image || "couchdb3.1",
		port: c.port || 5984,
		user: c.user || "kivik",
		password: c.password || "kivik",
	};
};

/** kivikrc file configuration. */
export interface Rc {
	/** List of deployment configurations. */
	deployments?: Record<string, Deployment>;
	/** Subdirectories of the root directory which do not contain database configuration. Default: `["node_modules"]` */
	excludeDirectories?: string[];
	/** JavaScript files to ignore when processing design documents. Default: `["*.spec.*", "*.test.*"]` */
	excludeDesign?: string[];
	/** Configuration for local, ephemeral Kivik containers */
	local?: LocalConfig;
}

export type NormalizedRc = Required<Rc> & {
	local: NormalizedLocalConfig;
};

/**
 * Normalize an Rc object with defaults.
 */
export const normalizeRc = (rc: Rc): NormalizedRc => {
	return {
		deployments: rc.deployments || {},
		excludeDirectories: rc.excludeDirectories || ["node_modules"],
		excludeDesign: rc.excludeDesign || ["*.spec.*", "*.test.*"],
		local: normalizeLocalConfig(rc.local || {}),
	};
};
