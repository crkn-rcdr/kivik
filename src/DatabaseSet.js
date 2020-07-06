const fs = require("fs-extra");
const Database = require("./Database");

module.exports = function DatabaseSet(
  directory,
  subset,
  mode,
  insertInvalidFixtures
) {
  const findDirectories = async () => {
    const directories = [];
    const contents = subset || (await fs.readdir(directory));
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
        let database = new Database(dir, mode, insertInvalidFixtures);
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
