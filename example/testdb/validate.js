const Ajv = require("ajv").default;
const fs = require("fs-extra");
const globby = require("globby");

const ajv = new Ajv();

let loaded = false;

/**
 * The validation function can return:
 * * a boolean
 * * an object boolean property `valid` and whatever you like in `errors`, which
 * is checked if `valid` is `false`
 * * a promise resolving to either of the above
 */
module.exports = (data) => {
  if (!loaded) {
    ajv.addSchema(fs.readJsonSync(`${__dirname}/../schemas/testdb.json`));
    loaded = true;
  }

  const validate = ajv.getSchema("/testdb");
  const valid = validate(data);
  if (valid) {
    return valid;
  } else {
    return { valid, errors: validate.errors };
  }
};
