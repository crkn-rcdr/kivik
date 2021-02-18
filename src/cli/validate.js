const getValidator = require("../getValidator");
const Logger = require("../Logger");

module.exports = async (argv) => {
  const logger = Logger.get();

  const validator = await getValidator(argv.directory, argv);
  const validate = validator(argv.database);
  const response = await validate(argv.document);

  if (response) {
    if (response.valid) {
      logger.alert(
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
    logger.error(`There is no schema available for database ${argv.database}`);
    process.exit(1);
  }
};
