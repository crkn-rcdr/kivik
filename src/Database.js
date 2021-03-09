const path = require("path");
const { getDesign, getFixtures } = require("./Database/DocSet");
const { getIndexes } = require("./Database/IndexSet");
const { withDefaults } = require("./options");
const Logger = require("./Logger");

const logger = Logger.get();

const defaulted = withDefaults(["deployFixtures", "excludeDesign", "suffix"]);

const fromDirectory = async (directory, options = {}) => {
  options = defaulted(options);

  const basename = path.basename(directory);
  const validateName = path.join(basename, "validate.js");
  const name = options.suffix ? `${basename}-${options.suffix}` : basename;

  let validate = null;
  try {
    const vPath = path.join(directory, "validate.js");
    validate = require(vPath);
    if (typeof validate !== "function") {
      logger.error(`${validateName} does not export a function.`);
    }
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") {
      logger.error(`Error loading ${validateName}`);
      logger.error(error);
    } else {
      logger.info(`${basename} does not provide a validator`);
    }
  }

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

    logger.info(`Database ${this.name} deployed.`);
  }
}

module.exports = { default: Database, fromDirectory };
