const fs = require("fs-extra");
const path = require("path");
const globby = require("globby");
const designDoc = require("./designDoc");
const Logger = require("../Logger");

const logger = Logger.get();

const getDesign = async (directory, options = {}) => {
  const designDirs = await globby(path.join(directory, "*"), {
    absolute: true,
    onlyDirectories: true,
  });

  const docs = await Promise.all(
    designDirs.map(async (dir) => designDoc(dir, options))
  );

  return new DocSet(docs);
};

const getFixtures = async (directory, validate = null) => {
  const valid = [];
  const invalid = {};
  for await (const fp of globby.stream(path.posix.join(directory, "*.json"), {
    absolute: true,
  })) {
    const name = path.basename(fp);
    const { _rev, ...fixture } = await fs.readJSON(fp);

    if (typeof validate === "function") {
      const response = await validate(fixture);
      if (!response.valid) {
        invalid[name] = response.message;
      } else {
        valid.push(fixture);
      }
    } else {
      valid.push(fixture);
    }
  }

  return { valid: new DocSet(valid), invalid };
};

class DocSet {
  constructor(docs) {
    this._docs = docs;
  }

  withId(id) {
    return this._docs.find((doc) => id === doc._id);
  }

  async deploy(nanoDb) {
    if (this._docs.length > 0) {
      const keys = this._docs.map((doc) => doc._id);
      const response = await nanoDb.fetch({ keys });
      response.rows
        .filter((row) => !row.error)
        .forEach((row) => {
          this.withId(row.id)._rev = row.value.rev;
        });
      await nanoDb.bulk({ docs: this._docs });
    }
  }
}

module.exports = { default: DocSet, getDesign, getFixtures };
