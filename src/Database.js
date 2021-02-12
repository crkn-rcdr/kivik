const path = require("path");
const { getDesign, getFixtures } = require("./Database/DocSet");
const { getIndexes } = require("./Database/IndexSet");
const { withDefaults } = require("./options");

const defaulted = withDefaults([
  "deployFixtures",
  "excludeDesign",
  "suffix",
  "verbose",
]);

const fromDirectory = async (directory, validate = null, options = {}) => {
  options = defaulted(options);

  const basename = path.basename(directory);
  const name = options.suffix ? `${basename}-${options.suffix}` : basename;
  const fixtures = await getFixtures(
    path.join(directory, "fixtures"),
    validate,
    options
  );
  const indexes = await getIndexes(path.join(directory, "indexes"));
  const designDocs = await getDesign(path.join(directory, "design"), options);

  return new Database(name, fixtures, indexes, designDocs, validate, options);
};

class Database {
  constructor(
    name,
    fixtures,
    indexes,
    designDocs,
    validate = null,
    options = {}
  ) {
    this.name = name;
    this.fixtures = fixtures;
    this.indexes = indexes;
    this.designDocs = designDocs;
    this.validate = validate;
    this._options = defaulted(options);
  }

  async deploy(nanoInstance) {
    let dbExists = true;
    try {
      await nanoInstance.db.get(this.name);
    } catch (error) {
      if (!(error.message === "no_db_file")) {
        dbExists = false;
      } else {
        throw error;
      }
    }

    if (!dbExists) await nanoInstance.db.create(this.name);

    const db = nanoInstance.use(this.name);

    if (this._options.deployFixtures) await this.fixtures.deploy(db);
    await this.indexes.deploy(nanoInstance, this.name);
    await this.designDocs.deploy(db);

    if (this._options.verbose > 0)
      console.log(`Database ${this.name} deployed.`);
  }
}

module.exports = { default: Database, fromDirectory };
