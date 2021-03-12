const path = require("path");
const Kivik = require("../Kivik");
const Logger = require("../Logger");

const logger = Logger.get();

module.exports = async (argv) => {
  const fixtureErrors = await Kivik.testFixtures(argv.directory, argv);

  let count = 0;
  Object.entries(fixtureErrors).forEach(([db, ref]) => {
    Object.entries(ref).forEach(([name, error]) => {
      count++;
      logger.error(`${path.join(db, name)}: ${error}`);
    });
  });
  process.exit(count);
};
