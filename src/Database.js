const fs = require("fs-extra");

module.exports = exports = function Database(directory, address) {
  this.directory = directory;
  this.dbName = this.directory.substring(this.directory.lastIndexOf("/") + 1);

  this.process = async () => {
    this.nano = require("nano")(address);

    this.fixtures = [];
    try {
      for (file of await fs.readdir([this.directory, "fixtures"].join("/"))) {
        if (file.endsWith(".json")) {
          const json = await fs.readJSON(
            [this.directory, "fixtures", file].join("/")
          );
          this.fixtures.push(json);
        }
      }
    } catch (ignore) {}

    this.fixturesLoadedFromDisk = true;

    await this.nano.db.create(this.dbName);
    this.db = this.nano.use(this.dbName);

    for (fixture of this.fixtures) {
      await this.db.insert(fixture);
    }

    this.fixturesInsertedIntoDatabase = true;
  };
};
