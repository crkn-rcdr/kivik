const getValidator = require("../getValidator");
const Instance = require("../Instance");
const Kivik = require("../Kivik");
const Logger = require("../Logger");

module.exports = {
  deploy: async (argv) => {
    const kivik = Kivik.fromDirectory(argv.directory, argv);

    const nanoInstance = authedNano(argv.url, argv.user, argv.password);

    await kivik.deploy(nanoInstance);
  },
  inspect: async (argv) => {
    const instance = await Instance.get(argv.directory, argv.port, argv);
    await instance.start();

    process.on("SIGINT", () => {
      instance.stop();
    });
  },
  validate: async (argv) => {
    const logger = Logger.get();

    const validator = await getValidator(argv.directory, argv);
    const response = await validator(argv.database)(argv.document);

    if (response) {
      if (response.valid) {
        logger.info(
          `${argv.document} validates against the schema for database ${argv.database}.`
        );
        process.exit(0);
      } else {
        logger.error(
          `${argv.document} does not validate against the schema for database ${argv.database}:\n${response.errors}`
        );
        process.exit(1);
      }
    } else {
      logger.error(
        `There is no schema available for database ${argv.database}`
      );
      process.exit(1);
    }
  },
};
