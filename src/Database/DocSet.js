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

const getFixtures = async (directory, validate = null, options = {}) => {
  let fixtures = await Promise.all(
    (
      await globby(path.posix.join(directory, "*.json"), {
        absolute: true,
      })
    ).map(async (fp) => [path.basename(fp), await fs.readJSON(fp)])
  );

  if (typeof validate === "function") {
    const results = await Promise.all(
      fixtures.map(async ([basename, fixture]) => {
        let response = await validate(fixture);
        if (typeof response === "boolean") {
          response = { valid: response };
        }
        if (!response.valid) {
          logger.warn(`Fixture ${basename} does not validate against schema.`);
          if (response.errors) {
            logger.warn(response.errors);
          }
        }
        return response.valid;
      })
    );

    fixtures = fixtures.filter((_pair, i) => results[i]);
  }

  return new DocSet(fixtures.map((pair) => pair[1]));
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
