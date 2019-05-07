const path = require("path");
const DatabaseSet = require("../DatabaseSet");

module.exports = {
  command: ["deploy [directory]"],
  describe: "Deploys design documents to a remote database",
  builder: {
    server: {
      default: "http://localhost:5984/",
      type: "string",
      describe: "Server to deploy documents to"
    },
    db: {
      type: "array",
      describe: "Database directory to deploy"
    }
  },
  handler: async argv => {
    const set = new DatabaseSet(
      path.resolve(argv.directory),
      argv.db,
      "deploy"
    );
    await set.load();
    await set.process(argv.server);
  }
};
