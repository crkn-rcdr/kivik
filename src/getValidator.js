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

  const schemas = [];
  const cwd = path.resolve(directory);

  schemas.push(
    ...(
      await globby("schemas/*.json", {
        cwd: cwd,
        absolute: true,
      })
    ).map((fullPath) => {
      return [fullPath, path.basename(fullPath, ".json")];
    })
  );

  const schemaMap = (glob) => path.posix.join(glob, "schema.json");
  schemas.push(
    ...(
      await globby(include.map(schemaMap), {
        ignore: exclude.map(schemaMap),
        cwd: cwd,
        absolute: true,
      })
    ).map((fullPath) => {
      return [fullPath, path.basename(path.dirname(fullPath))];
    })
  );

  await Promise.all(
    schemas.map(async ([path, key]) => {
      ajv.addSchema(await fs.readJSON(path), key);
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
