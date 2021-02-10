const Instance = require("../Instance");
const options = require("../options").slice(["image", "port"]);

module.exports = {
  command: ["inspect"],
  describe: "Spins up a CouchDB container for inspection",
  builder: options,
  handler: async (argv) => {
    const instance = new Instance(argv);
    await instance.start();
  },
};
