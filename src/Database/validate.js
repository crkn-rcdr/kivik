const path = require("path");
const Logger = require("../Logger");
const logger = Logger.get();

module.exports = (directory, cli = false) => {
  const alertIfCli = (message) => {
    cli ? logger.alert(message) : logger.info(message);
  };

  const dbName = path.basename(directory);
  try {
    const vPath = path.join(directory, "validate.js");
    validate = require(vPath);
    if (typeof validate !== "function") {
      logger.error(`${dbName}/validate.js does not export a function.`);
      return null;
    }
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") {
      logger.error(`Error loading ${dbName}/validate.js`);
      logger.error(error);
    } else {
      alertIfCli(`Database ${dbName} does not provide a validator`);
    }
    return null;
  }

  return async (docName, document) => {
    let response = await validate(document);
    if (typeof response === "boolean") {
      response = { valid: response };
    }

    if (response.valid) {
      alertIfCli(`${docName} validates against database ${dbName}.`);
    } else {
      logger.error(`${docName} does not validate against database ${dbName}.`);
      if (response.errors) {
        logger.error(
          "Validator errors: " + JSON.stringify(response.errors, null, 2)
        );
      }
    }

    return response.valid;
  };
};
