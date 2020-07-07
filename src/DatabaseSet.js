const fs = require("fs-extra");
const Database = require("./Database");

// available options include:
// subset: a list of subdirectories of the directory to include
// mode: "deploy" or "inspect"
// insertInvalidFixtures: boolean
module.exports = function DatabaseSet(directory, options) {
  options = Object.assign(
    {},
    { subset: [], mode: "inspect", insertInvalidFixtures: false },
    options || {}
  );

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
          console.log(`${dir} is not a directory, ignoring.`);
        }
      } catch (ignore) {
        console.log(`${dir} does not exist, ignoring.`);
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

  this.process = async (address) => {
    await Promise.all(
      this.databases.map((database) => database.process(address))
    );
  };
};
