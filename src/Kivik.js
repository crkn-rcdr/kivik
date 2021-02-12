const path = require("path");
const globby = require("globby");
const randomString = require("crypto-random-string");
const getValidator = require("./getValidator");
const Database = require("./Database");

const keys = [
  "include",
  "exclude",
  "suffix",
  "context",
  // these three are passed to Database
  "deployFixtures",
  "excludeDesign",
  "verbose",
];
const withDefaults = require("./options").withDefaults(keys);

const fromDirectory = async (directory, options = {}) => {
  options = withDefaults(options);

  const validator = await getValidator(directory, options);

  const databases = {};

  const wd = path.resolve(directory);
  const dirStream = globby.stream(options.include, {
    cwd: wd,
    ignore: options.exclude,
    onlyDirectories: true,
    expandDirectories: false,
    absolute: true,
  });

  for await (const dir of dirStream) {
    const dbName = dir.slice(dir.lastIndexOf(path.sep) + 1);
    databases[dbName] = await Database.fromDirectory(
      dir,
      options,
      validator(dbName)
    );
  }

  return new Kivik(databases, validator, options);
};

class Kivik {
  constructor(databases, validator, options) {
    this.databases = databases;
    this.validator = validator;
    this.suffix =
      options.suffix === "random"
        ? randomString({ length: 10 })
        : options.suffix;
  }

  suffixedName(name) {
    return this.suffix ? `${name}-${this.suffix}` : name;
  }

  async deploy(nanoInstance) {
    await Promise.all(
      Object.entries(this.databases).map(([name, db]) =>
        db.deploy(nanoInstance, this.suffixedName(name), this.validator(name))
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

module.exports = { default: Kivik, fromDirectory };
