const Kivik = require("../Kivik");
const Nano = require("@crkn-rcdr/nano").default;

module.exports = async (argv) => {
  const kivik = await Kivik.fromDirectory(argv.directory, argv);

  const nano = Nano.get(argv.url, argv);

  if (!nano) {
    process.exit(1);
  }

  await kivik.deploy(nano);
};
