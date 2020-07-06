const fs = require("fs");
const fetch = require("node-fetch");

const validate = require("../validate");

module.exports = {
  command: ["validate <document> [schema]", "$0"],
  describe:
    "Validates a JSON document against a JSON schema. The JSON document can either be a file or a URL. The specified schema can either be a file or a directory containing a 'schema.json' file; by default this is the current directory.",
  handler: async (argv) => {
    let schemaFile = argv.schema || ".";
    let schema;

    try {
      if (fs.statSync(schemaFile).isDirectory()) {
        schemaFile += "/schema.json";
      }
      schema = JSON.parse(fs.readFileSync(schemaFile));
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
        document = JSON.parse(fs.readFileSync(argv.document));
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
