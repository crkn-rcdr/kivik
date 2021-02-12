const fs = require("fs-extra");
const path = require("path");
const globby = require("globby");

const getIndexes = async (directory) => {
  const indexes = await Promise.all(
    (
      await globby(path.posix.join(directory, "*.json"), {
        absolute: true,
      })
    ).map(async (fp) => [path.basename(fp, ".json"), await fs.readJSON(fp)])
  );

  return new IndexSet(
    indexes.map(([name, index]) => {
      if (!index.name) index.name = name;
      if (!index.ddoc) index.ddoc = `index_${name}`;
      return index;
    })
  );
};

class IndexSet {
  constructor(indexes) {
    this._indexes = indexes;
  }

  withName(name) {
    return this._indexes.find((index) => name === index.name);
  }

  async deploy(nanoInstance, dbName) {
    return await Promise.all(
      this._indexes.map(async (index) => {
        nanoInstance.relax({
          db: dbName,
          path: "/_index",
          method: "post",
          body: index,
        });
      })
    );
  }
}

module.exports = { default: IndexSet, getIndexes };
