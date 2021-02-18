const path = require("path");
const fs = require("fs-extra");
const fetch = require("node-fetch");
const Ajv = require("ajv").default;
const addFormats = require("ajv-formats").default;
const globby = require("globby");
const { withDefaults } = require("./options");

const addSchemasFrom = async (ajv, options) => {
  const { include, exclude, cwd, keyFunc } = options;
  const paths = await globby(include, { exclude, cwd, absolute: true });
  await Promise.all(
    paths.map(async (fullPath) => {
      ajv.addSchema(await fs.readJSON(fullPath), keyFunc(fullPath));
    })
  );
};

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

  const cwd = path.resolve(directory);
  const schemaMap = (glob) => path.posix.join(glob, "schema.json");

  await addSchemasFrom(ajv, {
    include: "schemas/*.json",
    exclude: [],
    cwd,
    keyFunc: (fullPath) => path.basename(fullPath, ".json"),
  });
  await addSchemasFrom(ajv, {
    include: include.map(schemaMap),
    exclude: exclude.map(schemaMap),
    cwd,
    keyFunc: (fullPath) => path.basename(path.dirname(fullPath)),
  });

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

        const validate = ajv.getSchema(key);
        const valid = validate(document);

        const errors = valid
          ? ""
          : validate.errors
              .map((e, i) => `\t${i + 1}. ${e.schemaPath} ${e.message}`)
              .join("\n");

        return { valid, errors };
      };
    } else {
      return undefined;
    }
  };
};
