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
    const instance = await Instance.get(argv.directory, argv.port, argv);
    await instance.start();

    process.on("SIGINT", () => {
      instance.stop();
    });
  },
};
