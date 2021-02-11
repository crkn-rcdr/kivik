const authedNano = require("../nano");
const Kivik = require("../Kivik");

const keys = ["url", "user", "password", "deployFixtures", "createDatabases"];
const options = require("../options").slice(keys);

module.exports = {
  command: ["deploy"],
  describe: "Deploys design documents to a remote database",
  builder: options,
  handler: async (argv) => {
    const kivik = new Kivik({ ...argv, context: "deploy" });
    await kivik.load();

    const nanoInstance = authedNano(argv.url, argv.user, argv.password);

    await kivik.deploy(nanoInstance);
  },
};
