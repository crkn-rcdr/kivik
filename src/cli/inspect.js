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
      describe: "The base image for the container"
    },
    port: {
      default: 5984,
      type: "number",
      describe: "The host port CouchDB will be found at"
    },
    "couch-output": {
      default: false,
      type: "boolean",
      describe: "Show CouchDB output"
    },
    db: {
      type: "array",
      describe: "Database directory to inspect"
    }
  },
  handler: async argv => {
    const set = new DatabaseSet(
      path.resolve(argv.directory),
      argv.db,
      "inspect"
    );
    await set.load();

    const container = new Container(argv.image, argv.port);
    try {
      await container.run(argv["couch-output"]);
      await set.process(container.hostURL());
    } catch (e) {
      console.log(e);
      await container.kill();
    }
  }
};
