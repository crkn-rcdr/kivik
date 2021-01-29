const Ajv = require("ajv").default;

module.exports = function validate(document, schema) {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(document);
  if (valid) {
    return { success: true };
  } else {
    return { success: false, errors: validate.errors };
  }
};
