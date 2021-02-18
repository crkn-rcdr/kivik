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
        const response = await validate(fixture);
        if (!response.valid) {
          logger.warn(
            `Fixture ${basename} does not validate against schema: ${response.errors}`
          );
        }
        return response.valid;
      })
    );

    fixtures = fixtures.filter((_pair, i) => results[i]);
  }

  return new DocSet(fixtures.map((pair) => pair[1]));
};

const insertWithRev = async (nanoDb, doc) => {
  let rev;
  try {
    rev = (await nanoDb.get(doc._id))._rev;
  } catch (ignore) {}

  return nanoDb.insert(rev ? { doc, _rev: rev } : doc);
};

class DocSet {
  constructor(docs) {
    this._docs = docs;
  }

  withId(id) {
    return this._docs.find((doc) => id === doc._id);
  }

  async deploy(nanoDb) {
    return await Promise.all(
      this._docs.map((doc) => insertWithRev(nanoDb, doc))
    );
  }
}

module.exports = { default: DocSet, getDesign, getFixtures };
