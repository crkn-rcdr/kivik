const fs = require("fs-extra");
const Database = require("./Database");

module.exports = exports = function DatabaseSet(directory, subset, address) {
  this.directory = directory;
  this.subset = subset;
  this.couchAddress = address;

  const findDirectories = async () => {
    const directories = [];
    const contents = this.subset || (await fs.readdir(this.directory));
    for (c of contents) {
      const dir = [this.directory, c].join("/");
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

  this.databases = async () => {
    if (this._databases) return this._databases;
    this._databases = [];

    const directories = await findDirectories();
    for (dir of directories) {
      const database = new Database(dir, this.couchAddress);
      await database.process();
      this._databases.push(database);
    }

    return this._databases;
  };
};
