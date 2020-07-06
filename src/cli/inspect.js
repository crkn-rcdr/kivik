const path = require("path");
const Container = require("../Container");
const DatabaseSet = require("../DatabaseSet");

module.exports = {
  command: ["inspect [directory]", "$0"],
  describe: "Spins up a CouchDB container for inspection",
  builder: {
    image: {
      default: "couchdb:1.7",
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
      type: "array",
      describe: "Database directory to inspect",
    },
    "insert-invalid-fixtures": {
      default: false,
      type: "boolean",
      describe:
        "Insert fixtures into the inspection database even if they do not validate against the schema",
    },
  },
  handler: async (argv) => {
    const databaseSet = new DatabaseSet(
      path.resolve(argv.directory || "."),
      argv.db,
      "inspect",
      argv["insert-invalid-fixtures"]
    );
    await databaseSet.load();

    const container = new Container(argv.image, argv.port);
    try {
      await container.run(argv["couch-output"]);
      await databaseSet.process(container.hostURL());
    } catch (e) {
      console.log(e);
      await container.kill();
    }

    return [databaseSet, container];
  },
};
