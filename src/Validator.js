const fs = require("fs-extra");
const fetch = require("node-fetch");
const Kivik = require("./Kivik");

const keys = ["directory", "include", "exclude", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

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

module.exports = function Validator(options) {
  const kivik = new Kivik(withDefaults(options));

  this.validate = async (documentPath, database) => {
    await kivik.load();

    const kivikdb = kivik.databases[database];
    if (!kivikdb) {
      throw `Cannot find database ${database}.`;
    }

    if (!kivikdb.hasSchema) {
      throw `Database ${database} does not have an associated schema.`;
    }

    const document =
      (await fromURL(documentPath)) || (await fromFile(documentPath)) || null;

    if (!document) {
      throw `${documentPath} could not be loaded remotely or locally.`;
    }

    return kivikdb.validate(document);
  };

  this.errorsText = (errors) => kivik.validator.errorsText(errors);
};
