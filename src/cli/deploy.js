const Kivik = require("../Kivik");
const { authedNano } = require("../util");

module.exports = async (argv) => {
  const kivik = await Kivik.fromDirectory(argv.directory, argv);

  const nanoInstance = authedNano(argv.url, argv.user, argv.password);

  if (!nanoInstance) {
    process.exit(1);
  }

  await kivik.deploy(nanoInstance);
};
