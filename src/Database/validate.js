const { type } = require("os");
const path = require("path");
const Logger = require("../Logger");
const logger = Logger.get();

const alertIfCli = (cli, message) => {
  cli ? logger.alert(message) : logger.info(message);
};

module.exports = (directory, cli = false) => {
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
      alertIfCli(cli, `Database ${dbName} does not provide a validator`);
    }
    return null;
  }

  return async (document) => {
    const response = await validate(document);
    let valid;
    let errors = "";

    if (typeof response === "object") {
      valid = !!response.valid;
      errors =
        "\nValidator errors:\n" + JSON.stringify(response.errors, null, 2);
    } else {
      valid = !!response;
    }

    if (valid) {
      return {
        valid,
        message: `The document validates against database ${dbName}.`,
      };
    } else {
      return {
        valid,
        message: `The document does not validate against database ${dbName}.${errors}`,
      };
    }
  };
};
