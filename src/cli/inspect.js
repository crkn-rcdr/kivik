const Instance = require("../Instance");
const options = require("../options").slice(["image", "port"]);

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
