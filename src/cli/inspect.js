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
  const container = new Container({
    couchImage: argv.image,
    hostPort: argv.port
  });

  try {
    await container.run(argv["couch-output"]);
    const set = new DatabaseSet(argv.data, argv.dbs, container.hostURL());
    await set.process("inspect");
  } catch (e) {
    console.log(e);
    await container.kill();
  }
};
