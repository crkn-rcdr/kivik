const options = {
  config: {
    type: "string",
    describe:
      "Key to load a config object for this invocation of kivik in your kivikrc file.",
  },
  context: {
    type: "string",
    default: "inspect",
    hidden: true,
  },
  createDatabases: {
    type: "boolean",
    default: true,
    describe: "Creates databases at the CouchDB endpoint if they do not exist.",
  },
  deployFixtures: {
    type: "boolean",
    default: false,
    describe:
      "Deploys fixtures to the CouchDB endpoint, along with design documents",
  },
  directory: {
    type: "string",
    default: ".",
    hidden: true,
  },
  exclude: {
    type: "string",
    array: true,
    default: ["schemas", "node_modules"],
    describe:
      "Directories, or globs of directories, that do not contain database configuration.",
  },
  image: {
    default: "couchdb:3.1",
    type: "string",
    describe: "The base image for the instance's container",
  },
  include: {
    type: "string",
    array: true,
    default: ["*"],
    describe:
      "Directories, or globs of directories, which contain database configuration.",
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
      "Verbosity level. -v gives you a few extra strings, -vv gives you CouchDB's output if you're running an instance.",
  },
};

const slice = (keys) => {
  return keys.reduce((rv, curr) => {
    rv[curr] = options[curr];
    return rv;
  }, {});
};

const withDefaults = (keys) => {
  return (opts) => {
    return keys.reduce((rv, key) => {
      rv[key] = key in opts ? opts[key] : options[key].default;
      return rv;
    }, {});
  };
};

module.exports = { slice, withDefaults };
