const Validator = require("../Validator");

module.exports = {
  command: ["validate <document> <database>"],
  describe: "Validates a document against a database's JSON Schema.",
  builder: (yargs) => {
    return yargs
      .positional("document", {
        type: "string",
        describe:
          "The document to validate. Can be specified as either a local file or a URL.",
      })
      .positional("database", {
        type: "string",
        describe:
          "The database against whose schema the document will be validated.",
      });
  },
  handler: async (argv) => {
    const validator = new Validator(argv);
    try {
      const response = await validator.validate(argv.document, argv.database);
      if (response.valid) {
        console.log(
          `${argv.document} validates against the schema for database ${argv.database}.`
        );
        process.exit(0);
      } else {
        console.error(
          `${argv.document} does not validate against the schema for database ${argv.database}.`
        );
        console.error(validator.errorsText(response.errors));
        process.exit(1);
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  },
};
