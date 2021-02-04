const Instance = require("../Instance");

module.exports = {
  command: ["inspect [directory]", "$0"],
  describe: "Spins up a CouchDB container for inspection",
  builder: {
    image: {
      default: "couchdb:3.1",
      type: "string",
      describe: "The base image for the container",
    },
    port: {
      default: 5984,
      type: "number",
      describe: "The host port CouchDB will be found at",
    },
    "couch-output": {
      default: false,
      type: "boolean",
      describe: "Show CouchDB output",
    },
    db: {
      default: [],
      type: "array",
      describe: "Database directory to inspect",
    },
    "invalid-fixtures": {
      default: false,
      type: "boolean",
      describe:
        "Insert fixtures into the inspection database even if they do not validate against the schema",
    },
    quiet: {
      default: false,
      type: "boolean",
      describe: "Suppress console output",
    },
  },
  handler: async (argv) => {
    const instance = new Instance(argv.directory, {
      image: argv.image,
      port: argv.port,
      couchOutput: argv["couch-output"],
      dbSubset: argv.db,
      insertInvalidFixtures: argv["invalid-fixtures"],
      quiet: argv.quiet,
    });
    await instance.run();
    return instance;
  },
};
