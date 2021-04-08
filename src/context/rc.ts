import { ServerScope } from "nano";

/** Kivik RC file configuration. */
export interface Rc {
	/**
	 * Object containing deployment configurations. Adding at least one is
	 * required to be able to deploy Kivik configuration elsewhere.
	 */
	deployments?: Record<string, Deployment>;
	/** Subdirectories of the root directory which do not contain database configuration. Default: `["node_modules"]` */
	excludeDirectories?: string[];
	/** JavaScript files to ignore when processing design documents. Default: `["*.spec.*", "*.test.*"]` */
	excludeDesign?: string[];
	/** Configuration for Kivik instances. */
	local?: InstanceConfig;
}

/**
 * Configuration for deploying design documents to a CouchDB endpoint.
 */
export interface Deployment {
	/** CouchDB endpoint URL. Required. */
	url: string;
	/**
	 * Authentication credentials. If left unset, Kivik will attempt to deploy
	 * anonymously.
	 */
	auth?: {
		/** CouchDB username */
		user: string;
		/** `user`'s password */
		password: string;
	};
	/** Suffix to append to the end of each database name. Default: `undefined` */
	suffix?: string;
	/** Whether or not to deploy fixtures along with the design documents Default: `false`. */
	fixtures?: boolean;
}

export type NanoDeployment = {
	nano: ServerScope;
	suffix?: string;
	fixtures: boolean;
};

/** Configuration for Kivik instances. */
export interface InstanceConfig {
	/** Deploy fixtures when running `kivik dev`. Default: `true` */
	fixtures?: boolean;
	/** CouchDB docker image tag. Default: `couchdb:3.1` */
	image?: string;
	/** Port that Kivik will attempt to run a `kivik dev` instance on. Default: `5984` */
	port?: number;
	/** CouchDB admin user. Default: `kivik` */
	user?: string;
	/** CouchDB admin user's password. Default: `kivik` */
	password?: string;
}

export type NormalizedInstanceConfig = Required<InstanceConfig>;

/**
 * Normalize a InstanceConfig object with defaults.
 */
export const normalizeInstanceConfig = (
	c: InstanceConfig
): NormalizedInstanceConfig => {
	return {
		fixtures: typeof c.fixtures === "boolean" ? c.fixtures : true,
		image: c.image || "couchdb:3.1",
		port: c.port || 5984,
		user: c.user || "kivik",
		password: c.password || "kivik",
	};
};

export type NormalizedRc = Required<Omit<Rc, "local">> & {
	/** Configuration for local, ephemeral Kivik containers */
	local: NormalizedInstanceConfig;
};

/**
 * Normalize an Rc object with defaults.
 */
export const normalizeRc = (rc: Rc): NormalizedRc => {
	return {
		deployments: rc.deployments || {},
		excludeDirectories: rc.excludeDirectories || ["node_modules"],
		excludeDesign: rc.excludeDesign || ["*.spec.*", "*.test.*"],
		local: normalizeInstanceConfig(rc.local || {}),
	};
};
