const path = require("path");
const globby = require("globby");
const randomString = require("crypto-random-string");
const { withDefaults } = require("./options");
const getValidator = require("./getValidator");
const Database = require("./Database");

const defaulted = withDefaults([
  "deployFixtures",
  "exclude",
  "excludeDesign",
  "include",
  "logLevel",
  "suffix",
]);

const fromDirectory = async (directory, options = {}) => {
  options = defaulted(options);

  if (options.suffix === "random")
    options.suffix = randomString({ length: 10 });

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
    const dbName = path.basename(dir);
    databases[dbName] = await Database.fromDirectory(
      dir,
      validator(dbName),
      options
    );
  }

  return new Kivik(databases, validator, options);
};

class Kivik {
  constructor(databases, validator, options = {}) {
    this.databases = databases;
    this.validator = validator;
    this.suffix = options.suffix;
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
