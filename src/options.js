const options = {
  context: {
    type: "string",
    default: "inspect",
    describe: "The mode Kivik is running in.",
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
    alias: ["dir", "from"],
    type: "string",
    default: ".",
    describe:
      "Directory containing the set of database configuration directories to use.",
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
  url: {
    alias: "to",
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
