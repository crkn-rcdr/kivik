const fs = require("fs-extra");
const fetch = require("node-fetch");
const Kivik = require("../Kivik");
const validate = require("../validate");

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

const abort = (errorMessage) => {
  console.error(errorMessage);
  process.exit(1);
};

module.exports = {
  command: ["validate <document> <db>"],
  describe: "Validates a document against a database's JSON Schema.",
  builder: (yargs) => {
    return yargs
      .positional("document", {
        type: "string",
        describe:
          "The document to validate. Can be specified as either a local file or a URL.",
      })
      .positional("db", {
        type: "string",
        describe:
          "The database against whose schema the document will be validated.",
      });
  },
  handler: async (argv) => {
    const kivik = new Kivik({ ...argv, context: "validate" });
    console.error("kivik", kivik);
    await kivik.load();
    console.error("kivik", kivik);

    const db = kivik.databases[argv.db];
    if (!db) {
      abort(`Cannot find database ${argv.db}.`);
      return;
    }

    const schema = db.schema;
    if (!schema) {
      abort(`Database ${argv.db} does not have an associated schema.`);
      return;
    }

    const document =
      (await fromURL(argv.document)) || (await fromFile(argv.document)) || null;

    if (!document) {
      abort(`${argv.document} could not be loaded remotely or locally.`);
      return;
    }

    let response = validate(document, schema);
    if (response.success) {
      console.log("Document is valid!");
      process.exit(0);
    } else {
      console.error("Document is invalid:");
      for (const error of response.errors) {
        console.error(error);
      }
      process.exit(1);
    }
  },
};
