const path = require("path");
const fs = require("fs-extra");
const fetch = require("node-fetch");
const Ajv = require("ajv").default;
const addFormats = require("ajv-formats").default;
const globby = require("globby");
const { withDefaults } = require("./options");

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

const defaulted = withDefaults(["include", "exclude"]);

module.exports = async (directory, options = {}) => {
  const { include, exclude } = defaulted(options);

  const ajv = new Ajv();
  // TODO: config for which formats to add?
  addFormats(ajv);

  const schemaMap = (glob) => path.posix.join(glob, "schema.json");
  const schemaPaths = await globby(include.map(schemaMap), {
    ignore: exclude.map(schemaMap),
    cwd: path.resolve(directory),
    absolute: true,
  });
  await Promise.all(
    schemaPaths.map(async (sp) => {
      const split = sp.split("/");
      ajv.addSchema(await fs.readJSON(sp), split[split.length - 2]);
    })
  );

  return (key) => {
    const validate = ajv.getSchema(key);

    if (typeof validate === "function") {
      return async (document) => {
        const documentPath = document;

        if (typeof document === "string") {
          document =
            (await fromURL(documentPath)) ||
            (await fromFile(documentPath)) ||
            null;
        }

        if (!document) {
          throw `${documentPath} could not be loaded remotely or locally.`;
        }

        const valid = ajv.validate(key, document);

        return {
          valid,
          errors: valid ? "" : ajv.errorsText(),
        };
      };
    } else {
      return undefined;
    }
  };
};
