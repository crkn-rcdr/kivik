const path = require("path");
const Deployer = require("../Deployer");

module.exports = {
  command: ["deploy [directory]"],
  describe: "Deploys design documents to a remote database",
  builder: {
    server: {
      default: "http://localhost:5984/",
      type: "string",
      describe: "Server to deploy documents to",
    },
    db: {
      type: "array",
      describe: "Database directory to deploy",
    },
    fixtures: {
      type: "boolean",
      default: false,
      describe: "Deploy fixtures to database",
    },
    "create-databases": {
      type: "boolean",
      default: false,
      describe: "Create databases when they do not exist on the Couch server",
    },
    quiet: {
      default: false,
      type: "boolean",
      describe: "Suppress console output",
    },
  },
  handler: async (argv) => {
    const deployer = new Deployer(
      path.resolve(argv.directory) || ".",
      argv.server,
      {
        dbSubset: argv.db,
        fixtures: argv.fixtures,
        invalidFixtures: false,
        createDatabases: argv["create-databases"],
        quiet: argv.quiet,
      }
    );

    await deployer.load();
    await deployer.deploy();

    return deployer;
  },
};
