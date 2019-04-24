const Container = require("../Container");
const DatabaseSet = require("../DatabaseSet");

exports.command = ["inspect [dbs..]", "$0"];
exports.describe = "Spins up a CouchDB container for inspection";
exports.builder = {
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
  data: {
    default: "./couch",
    type: "string",
    describe: "Base directory for CouchDB data"
  }
};
exports.handler = async argv => {
  const set = new DatabaseSet(argv.data, argv.dbs, "inspect");
  await set.load();

  const container = new Container(argv.image, argv.port);
  try {
    await container.run(argv["couch-output"]);
    await set.process(container.hostURL());
  } catch (e) {
    console.log(e);
    await container.kill();
  }
};
