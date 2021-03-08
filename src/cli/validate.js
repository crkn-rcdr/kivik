const fs = require("fs-extra");
const fetch = require("node-fetch");
const path = require("path");
const Database = require("../Database");
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

  const db = await Database.fromDirectory(
    path.join(argv.directory, argv.database)
  );

  if (typeof db.validate === "function") {
    const document =
      (await fromURL(argv.document)) || (await fromFile(argv.document)) || null;

    if (!document) {
      logger.error(`${argv.document} could not be loaded remotely or locally.`);
      process.exit(1);
    }

    let response = db.validate(document);
    if (typeof response === "boolean") {
      response = { valid: response };
    }

    if (response.valid) {
      logger.alert(
        `${argv.document} validates against database ${argv.database}.`
      );
      process.exit(0);
    } else {
      logger.error(
        `${argv.document} does not validate against database ${argv.database}.`
      );
      if (response.errors) {
        logger.error(JSON.stringify(response.errors, null, 2));
      }
      process.exit(1);
    }
  } else {
    logger.error(
      `${path.join(argv.database, "validate.js")} does not export a function.`
    );
    process.exit(1);
  }
};
