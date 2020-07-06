const ajv = new require("ajv")();

module.exports = function validate(document, schema) {
  let valid = ajv.validate(schema, document);
  if (valid) {
    return { success: true };
  } else {
    return { success: false, errors: ajv.errors };
  }
};
