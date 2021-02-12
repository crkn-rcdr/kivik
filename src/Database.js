const fs = require("fs-extra");
const globby = require("globby");
const path = require("path");
const DesignDoc = require("./DesignDoc");
const objectFromEntries = require("./util").objectFromEntries;

const getJSON = async (directory, subdir) => {
  const paths = await globby(path.posix.join(directory, subdir, "*.json"), {
    absolute: true,
  });

  return objectFromEntries(
    await Promise.all(
      paths.map(async (p) => {
        const json = await fs.readJSON(p);
        return [path.basename(p, ".json"), json];
      })
    )
  );
};

const getDesignDocs = async (directory, options = {}) => {
  const designDirs = await globby(path.join(directory, "design", "*"), {
    absolute: true,
    onlyDirectories: true,
  });

  return objectFromEntries(
    await Promise.all(
      designDirs.map(async (dir) => {
        const ddoc = await DesignDoc.fromDirectory(dir, options);
        return [ddoc.id(), ddoc];
      })
    )
  );
};

const keys = ["deployFixtures", "excludeDesign", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

const fromDirectory = async (directory, options = {}) => {
  options = withDefaults(options);

  const dbName = directory.slice(directory.lastIndexOf(path.sep) + 1);
  const fixtures = await getJSON(directory, "fixtures");
  const designDocs = await getDesignDocs(directory, options);

  const indexes = objectFromEntries(
    Object.entries(await getJSON(directory, "indexes")).map(([name, index]) => {
      if (!index.name) index.name = name;
      if (!index.ddoc) index.ddoc = `index_${name}`;
      return [name, index];
    })
  );

  return new Database(dbName, fixtures, indexes, designDocs, options);
};

class Database {
  constructor(name, fixtures, indexes, designDocs, options = {}) {
    this.name = name;
    this.fixtures = fixtures;
    this.indexes = indexes;
    this.designDocs = designDocs;
    this._options = options;
  }

  async deploy(nanoInstance, name = this.name, validate = null) {
    let dbExists = true;
    try {
      await nanoInstance.db.get(name);
    } catch (error) {
      if (!(error.message === "no_db_file")) {
        dbExists = false;
      } else {
        throw error;
      }
    }

    if (!dbExists) await nanoInstance.db.create(name);

    const db = nanoInstance.use(name);

    if (this._options.deployFixtures) {
      await Promise.all(
        Object.values(this.fixtures).map(async (fixture) => {
          let insert = true;
          if (validate) {
            const response = await validate(fixture);
            if (!response.valid) {
              insert = false;
              if (this._options.verbose > 1) {
                console.warn(
                  `Database ${this.name}: Fixture ${key} does not validate against schema:`,
                  response.errors
                );
              }
            }
          }
          return insert ? db.insert(fixture) : null;
        })
      );
    }

    await Promise.all(
      Object.values(this.indexes).map(async (index) => {
        nanoInstance.relax({
          db: name,
          path: "/_index",
          method: "post",
          body: index,
        });
      })
    );

    await Promise.all(
      Object.entries(this.designDocs).map(async ([id, ddoc]) => {
        let rev;
        try {
          rev = (await db.get(id))._rev;
        } catch (ignore) {}

        return db.insert(ddoc.doc(rev));
      })
    );

    if (this._options.verbose > 0) console.log(`Database ${name} deployed.`);
  }
}

module.exports = { default: Database, fromDirectory };
