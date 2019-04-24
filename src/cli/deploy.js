const DatabaseSet = require("../DatabaseSet");
const nano = require("nano");

exports.command = ["deploy [dbs..]"];
exports.describe = "Deploys design documents to a remote database";
exports.builder = {
  server: {
    default: "http://localhost:5984/",
    type: "string",
    describe: "Server to deploy documents to"
  },
  data: {
    default: "./couch",
    type: "string",
    describe: "Base directory for CouchDB data"
  }
};
exports.handler = async argv => {
  const set = new DatabaseSet(argv.data, argv.dbs, "deploy");
  await set.load();
  await set.process(argv.server);
};
