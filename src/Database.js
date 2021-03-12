const path = require("path");
const { getDesign, getFixtures } = require("./Database/DocSet");
const { getIndexes } = require("./Database/IndexSet");
const getValidate = require("./Database/validate");
const { withDefaults } = require("./options");
const Logger = require("./Logger");

const logger = Logger.get();

const defaulted = withDefaults([
  "cli",
  "deployFixtures",
  "excludeDesign",
  "suffix",
]);

const setup = async (directory, options) => {
  const dbName = path.basename(directory);
  const validate = getValidate(directory, options.cli);

  const { valid: fixtures, invalid: fixtureErrors } = await getFixtures(
    path.join(directory, "fixtures"),
    validate,
    options
  );

  return { dbName, validate, fixtures, fixtureErrors };
};

const fromDirectory = async (directory, options = {}) => {
  options = defaulted(options);

  const { dbName, validate, fixtures, fixtureErrors } = await setup(
    directory,
    options
  );

  const name = options.suffix ? `${dbName}-${options.suffix}` : dbName;

  Object.entries(fixtureErrors).forEach(([name, errors]) => {
    let message = `${dbName}/fixtures/${name} does not validate.`;
    if (errors) {
      message += "\n" + JSON.stringify(errors, null, 2);
    }
    logger.warn(message);
  });

  const indexes = await getIndexes(path.join(directory, "indexes"));
  const designDocs = await getDesign(path.join(directory, "design"), options);

  return new Database(name, fixtures, indexes, designDocs, validate, options);
};

const testFixtures = async (directory, options = {}) => {
  options = defaulted(options);

  const { fixtureErrors } = await setup(directory, options);

  return fixtureErrors;
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

    logger.info(`Database ${this.name} deployed.`);
  }
}

module.exports = { default: Database, fromDirectory, testFixtures };
