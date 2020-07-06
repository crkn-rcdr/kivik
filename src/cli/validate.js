const fs = require("fs-extra");
const fetch = require("node-fetch");

const validate = require("../validate");

module.exports = {
  command: ["validate <document> [schema]"],
  describe:
    "Validates a JSON document against a JSON schema. The JSON document can either be a file or a URL. The specified schema can either be a file or a directory containing a 'schema.json' file; by default this is the current directory.",
  handler: async (argv) => {
    let schemaFile = argv.schema || ".";
    let schema;

    try {
      if ((await fs.stat(schemaFile)).isDirectory()) {
        schemaFile += "/schema.json";
      }
      schema = await fs.readJSON(schemaFile);
    } catch (e) {
      console.error("Could not open or parse the JSON schema");
      console.error(e.message);
      process.exit(1);
    }

    let document, fetched;
    let errors = [];
    try {
      let response = await fetch(argv.document);
      document = await response.json();
      fetched = true;
    } catch (e) {
      errors.push("Could not fetch document remotely: " + e.message);
    }

    if (!fetched) {
      try {
        document = await fs.readJSON(argv.document);
        fetched = true;
      } catch (e) {
        errors.push("Could not load document locally: " + e.message);
      }
    }

    if (!fetched) {
      console.error(errors);
      process.exit(1);
    }

    let response = validate(document, schema);
    if (response.success) {
      console.log("Document is valid!");
      process.exit(0);
    } else {
      console.error("Document is invalid:");
      console.error(response.errors[0]);
      process.exit(1);
    }
  },
};
