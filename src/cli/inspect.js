const Instance = require("../Instance");
const { slice: sliceOptions } = require("../options");

const options = sliceOptions(["image", "port"]);

module.exports = {
  command: ["inspect"],
  describe: "Spins up a CouchDB container for inspection",
  builder: options,
  handler: async (argv) => {
    if (argv.verbose < 1) {
      argv.verbose = 1;
      argv.v = 1;
    }
    const instance = new Instance(argv.directory, argv);
    await instance.start();
  },
};
