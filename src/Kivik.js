const path = require("path");
const globby = require("globby");
const randomString = require("crypto-random-string");
const { withDefaults } = require("./options");
const Database = require("./Database");

const defaulted = withDefaults([
  "deployFixtures",
  "exclude",
  "excludeDesign",
  "include",
  "logLevel",
  "suffix",
]);

const dirStream = (directory, options) => {
  const wd = path.resolve(directory);
  return globby.stream(options.include, {
    cwd: wd,
    ignore: options.exclude,
    onlyDirectories: true,
    expandDirectories: false,
    absolute: true,
  });
};

const fromDirectory = async (directory, options = {}) => {
  options = defaulted(options);

  if (options.suffix === "random")
    options.suffix = randomString({ length: 10 });

  const stream = dirStream(directory, options);
  const databases = {};

  for await (const dir of stream) {
    const dbName = path.basename(dir);
    databases[dbName] = await Database.fromDirectory(dir, options);
  }

  return new Kivik(databases, options);
};

const testFixtures = async (directory, options = {}) => {
  options = defaulted(options);

  const stream = dirStream(directory, options);
  const databases = {};

  for await (const dir of stream) {
    const dbName = path.basename(dir);
    databases[dbName] = await Database.testFixtures(dir, options);
  }

  return databases;
};

class Kivik {
  constructor(databases, options = {}) {
    this.databases = databases;
    this.suffix = options.suffix;
  }

  suffixedName(name) {
    return this.suffix ? `${name}-${this.suffix}` : name;
  }

  async deploy(nanoInstance) {
    await Promise.all(
      Object.entries(this.databases).map(([name, db]) =>
        db.deploy(nanoInstance, this.suffixedName(name))
      )
    );
  }

  async destroy(nanoInstance) {
    await Promise.all(
      Object.entries(this.databases).map(([name, _db]) =>
        nanoInstance.db.destroy(this.suffixedName(name))
      )
    );
  }
}

module.exports = { default: Kivik, fromDirectory, testFixtures };
