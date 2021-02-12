const { slice: sliceOptions } = require("../options");
const { authedNano } = require("../util");
const Kivik = require("../Kivik");

const options = sliceOptions([
  "url",
  "user",
  "password",
  "deployFixtures",
  "suffix",
]);

module.exports = {
  command: ["deploy"],
  describe: "Deploys design documents to a remote database",
  builder: options,
  handler: async (argv) => {
    const kivik = Kivik.fromDirectory(argv.directory, {
      ...argv,
      context: "deploy",
    });

    const nanoInstance = authedNano(argv.url, argv.user, argv.password);

    await kivik.deploy(nanoInstance);
  },
};
