const fs = require("fs-extra");
const path = require("path");
const DesignDoc = require("./DesignDoc");

module.exports = exports = function Database(directory, address) {
  this.directory = directory;
  this.dbName = this.directory.slice(this.directory.lastIndexOf("/") + 1);

  this.process = async (mode = "inspect") => {
    let nano = require("nano")(address);
    try {
      await nano.db.create(this.dbName);
    } catch (e) {
      if (!(e.error === "file_exists")) {
        console.log(`Could not create or find database ${this.dbName}`);
        return;
      }
    }
    this.db = nano.use(this.dbName);

    if (mode === "inspect") await this.insertFixtures();
    await this.insertDesignDocs();

    console.log(`Database ${this.dbName} processed.`);
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
    let designDir = path.join(this.directory, "design");
    let designSubdirectories;
    try {
      designSubdirectories = await fs.readdir(designDir);
    } catch (e) {
      console.log(`No design directory found in ${this.directory}`);
      return;
    }

    for (dir of designSubdirectories) {
      let docId = `_design/${dir}`;
      let rev;
      try {
        rev = (await this.db.get(docId))["_rev"];
      } catch (e) {
        if (!e.statusCode === 404) return;
      }
      let ddoc = new DesignDoc(path.join(designDir, dir), rev);
      try {
        let json = await ddoc.representation();
        await this.db.insert(json);
      } catch (e) {
        console.log(`Could not insert design doc ${docId}: ${e.error}`);
      }
    }
  };
};
