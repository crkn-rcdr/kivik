const fs = require("fs-extra");
const path = require("path");
const DesignDoc = require("./DesignDoc");

module.exports = function Database(directory, mode) {
  const dbName = directory.slice(directory.lastIndexOf("/") + 1);

  this.load = async () => {
    let fixturesDir = path.join(directory, "fixtures");
    let fixtureContents = [];
    try {
      fixtureContents = await fs.readdir(fixturesDir);
    } catch (ignore) {}
    this.fixtures = await Promise.all(
      fixtureContents
        .filter(file => file.endsWith(".json"))
        .map(async file => await fs.readJSON(path.join(fixturesDir, file)))
    );

    let designDir = path.join(directory, "design");
    let designSubdirectories = [];
    try {
      designSubdirectories = await fs.readdir(designDir);
    } catch (e) {
      console.log(`No design directory found in ${directory}`);
      return;
    }
    this.designDocs = await Promise.all(
      designSubdirectories.map(async dir => {
        let ddoc = new DesignDoc(path.join(designDir, dir));
        await ddoc.load();
        return ddoc;
      })
    );
  };

  this.process = async address => {
    let nano = require("nano")(address);
    try {
      await nano.db.create(dbName);
    } catch (e) {
      if (!(e.error === "file_exists")) {
        console.log(`Could not create or find database ${dbName}`);
        return;
      }
    }
    const db = nano.use(dbName);

    if (mode === "inspect") {
      this.fixtures.forEach(async fixture => {
        try {
          await db.insert(fixture);
        } catch (ignore) {}
      });
    }

    this.designDocs.forEach(async ddoc => {
      let rev;
      try {
        rev = (await db.get(ddoc.id))["_rev"];
      } catch (e) {
        if (!e.statusCode === 404) return;
      }

      try {
        await db.insert(ddoc.docWithRev(rev));
      } catch (e) {
        console.log(`Could not insert design doc ${ddoc.id}: ${e.error}`);
      }
    });

    console.log(`Database ${dbName} processed.`);
  };
};
