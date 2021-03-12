const fs = require("fs-extra");
const fetch = require("node-fetch");
const path = require("path");
const getValidate = require("../Database/validate");
const Logger = require("../Logger");

const fromURL = async (input) => {
  try {
    const url = new URL(input);
    const response = await fetch(url);
    return await response.json();
  } catch (_) {
    return null;
  }
};

const fromFile = async (input) => {
  try {
    return await fs.readJSON(input);
  } catch (_) {
    return null;
  }
};

module.exports = async (argv) => {
  const logger = Logger.get();

  const validate = getValidate(path.join(argv.directory, argv.database), true);

  if (typeof validate === "function") {
    const document =
      (await fromURL(argv.document)) || (await fromFile(argv.document)) || null;

    if (!document) {
      logger.error(`${argv.document} could not be loaded remotely or locally.`);
      process.exit(1);
    }

    const response = await validate(document);

    if (response.valid) {
      logger.alert(response.message);
      process.exit(0);
    } else {
      logger.error(response.message);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
};
