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
  excludeDesign: {
    type: "string",
    array: true,
    default: ["*.test.js"],
    describe: "JavaScript files to ignore when processing design documents.",
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
