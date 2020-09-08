const fs = require("fs-extra");
const Database = require("./Database");

// available options include:
// subset: a list of subdirectories of the directory to include
// fixtures: deploy fixtures to databases
// invalidFixtures: deploy fixtures to databases that do not validate
// createDatabases: create databases when they do not exist
// quiet: suppress console.log
module.exports = function DatabaseSet(directory, options) {
  options = Object.assign(
    {},
    {
      fixtures: false,
      invalidFixtures: false,
      createDatabases: true,
      quiet: false,
    },
    options || {}
  );
  if (!options.subset) options.subset = [];

  const findDirectories = async () => {
    const directories = [];
    const contents =
      options.subset.length > 0 ? options.subset : await fs.readdir(directory);
    for (c of contents) {
      const dir = [directory, c].join("/");
      try {
        if ((await fs.stat(dir)).isDirectory()) {
          directories.push(dir);
        } else {
          if (!options.quiet)
            console.log(`${dir} is not a directory, ignoring.`);
        }
      } catch (ignore) {
        if (!options.quiet) console.log(`${dir} does not exist, ignoring.`);
      }
    }
    return directories;
  };

  this.load = async () => {
    this.databases = await Promise.all(
      (await findDirectories()).map(async (dir) => {
        let database = new Database(dir, options);
        await database.load();
        return database;
      })
    );
  };

  this.deploy = async (address) => {
    await Promise.all(
      this.databases.map((database) => database.deploy(address))
    );
  };
};
