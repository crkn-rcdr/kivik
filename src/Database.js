const fs = require("fs-extra");
const path = require("path");
const DesignDoc = require("./DesignDoc");

module.exports = exports = function Database(directory, address) {
  this.directory = directory;
  this.dbName = this.directory.slice(this.directory.lastIndexOf("/") + 1);

  this.process = async () => {
    let nano = require("nano")(address);
    await nano.db.create(this.dbName);
    this.db = nano.use(this.dbName);

    await this.insertFixtures();
    await this.insertDesignDocs();

    console.log(`Database ${this.dbName} loaded.`);
  };

  this.insertFixtures = async () => {
    try {
      let fixturesDir = path.join(this.directory, "fixtures");
      for (file of await fs.readdir(fixturesDir)) {
        if (file.endsWith(".json")) {
          let json = await fs.readJSON(path.join(fixturesDir, file));
          await this.db.insert(json);
        }
      }
    } catch (ignore) {}
  };

  this.insertDesignDocs = async () => {
    try {
      let designDir = path.join(this.directory, "design");
      for (dir of await fs.readdir(designDir)) {
        let ddoc = new DesignDoc(path.join(designDir, dir));
        let json = await ddoc.asJSON();
        await this.db.insert(json);
      }
    } catch (e) {
      console.log(e);
    }
  };
};
