const path = require("path");
const globby = require("globby");
const Ajv = require("ajv").default;
const addFormats = require("ajv-formats").default;
const Database = require("./Database");

const keys = [
  "directory",
  "include",
  "exclude",
  "context",
  // these three are passed to Database
  "deployFixtures",
  "createDatabases",
  "excludeDesign",
  "verbose",
];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function Kivik(options = {}) {
  options = withDefaults(options);

  this.databases = {};
  this.validator = new Ajv();
  // TODO: config for which formats to add?
  addFormats(this.validator);

  let loaded = false;

  this.load = async () => {
    if (!loaded) {
      const wd = path.resolve(options.directory);
      const pathStream = globby.stream(options.include, {
        cwd: wd,
        ignore: options.exclude,
        onlyDirectories: true,
        expandDirectories: false,
        absolute: true,
      });

      for await (const path of pathStream) {
        const db = new Database(path, options, this.validator);
        await db.load();
        this.databases[db.name] = db;
      }

      loaded = true;
    }
  };

  this.deploy = async (nanoInstance) => {
    await Promise.all(
      Object.values(this.databases).map((db) => db.deploy(nanoInstance))
    );
  };

  this.reset = async (nanoInstance) => {
    if (options.context === "inspect") {
      await Promise.all(
        Object.values(this.databases).map((db) =>
          nanoInstance.db.destroy(db.name)
        )
      );
    } else {
      throw new Error(
        "Resetting a Kivik deployment can only take place in the 'inspect' context."
      );
    }
  };
};
