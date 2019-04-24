const DatabaseSet = require("../DatabaseSet");

module.exports = {
  command: ["deploy [dbs..]"],
  describe: "Deploys design documents to a remote database",
  builder: {
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
  },
  handler: async argv => {
    const set = new DatabaseSet(argv.data, argv.dbs, "deploy");
    await set.load();
    await set.process(argv.server);
  }
};
