const options = {
  cli: {
    type: "boolean",
    describe: "Whether Kivik has been invoked from the command line.",
    default: false,
    hidden: true,
  },
  config: {
    type: "string",
    describe:
      "Key to load a config object for this invocation of kivik in your kivikrc file.",
  },
  database: {
    type: "string",
    hidden: true,
    describe: "The database whose schema will be validated against a document",
  },
  deployFixtures: {
    type: "boolean",
    default: false,
    describe: "Deploys fixtures to the CouchDB endpoint, e.g. for testing.",
  },
  directory: {
    type: "string",
    default: ".",
    hidden: true,
    describe: "Path to the root directory containing Kivik configuration.",
  },
  document: {
    type: "string",
    hidden: true,
    describe: "The document to validate against a database's schema",
  },
  exclude: {
    type: "string",
    array: true,
    default: ["schemas", "node_modules"],
    describe:
      "Subdirectories of the root directory which do not contain database configuration.",
  },
  excludeDesign: {
    type: "string",
    array: true,
    default: ["*.test.js"],
    describe: "JavaScript files to ignore when processing design documents.",
  },
  image: {
    default: "couchdb:3.1",
    type: "string",
    describe: "The base image for the instance's container.",
  },
  include: {
    type: "string",
    array: true,
    default: ["*"],
    describe:
      "Subdirectories of the root directory which contain database configuration.",
  },
  logLevel: {
    type: "string",
    choices: ["error", "warn", "info", "couch", "debug"],
    describe:
      "If set, Kivik will log output at and above the provided log level to $KIVIKDIR/.kivik.log",
  },
  password: {
    type: "string",
    describe: "CouchDB user's password.",
    implies: "user",
  },
  port: {
    type: "number",
    describe:
      "Local port at which the Docker container will be reachable. If left unset, or if the port is unavailable, a random available port will be selected.",
  },
  suffix: {
    type: "string",
    describe:
      "Suffix to append to database names when deployed. With a database named 'things' and suffix 'test', the database will be deployed as 'things-test'. A suffix of 'random' will be replaced by a random string.",
  },
  url: {
    type: "string",
    describe: "CouchDB endpoint receiving database configuration.",
    demandOption: true,
  },
  user: {
    type: "string",
    describe:
      "CouchDB user. Left unset, kivik will attempt to deploy database config anonymously.",
    implies: "password",
  },
  verbose: {
    alias: "v",
    type: "count",
    default: 0,
    describe:
      "Verbosity level: 0 for errors, 1 for warnings, etc. For logging when invoked programmatically, see 'logLevel'",
  },
};

const slice = (keys) => {
  return keys.reduce((rv, curr) => {
    rv[curr] = options[curr];
    return rv;
  }, {});
};

const withDefaults = (keys = undefined) => {
  if (!keys) keys = Object.keys(options);
  return (opts) => {
    return keys.reduce((rv, key) => {
      rv[key] = key in opts ? opts[key] : options[key].default;
      return rv;
    }, {});
  };
};

module.exports = { slice, withDefaults };
