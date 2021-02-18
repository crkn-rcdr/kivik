const path = require("path");

module.exports = (...subdir) => {
  return path.resolve(
    path.join(__dirname, "..", path.join("example", ...subdir))
  );
};
