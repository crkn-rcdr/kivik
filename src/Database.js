const fs = require("fs-extra");
const path = require("path");
const validate = require("./validate");
const DesignDoc = require("./DesignDoc");

// options can include:
// mode: "deploy" or "inspect"
// insertInvalidFixtures: boolean
module.exports = function Database(directory, options) {
  options = Object.assign(
    {},
    { mode: "inspect", insertInvalidFixtures: false },
    options || {}
  );

  const dbName = directory.slice(directory.lastIndexOf("/") + 1);

  this.load = async () => {
    let schemaFile = path.join(directory, "schema.json");
    try {
      this.schema = await fs.readJSON(schemaFile);
    } catch (e) {
      if (e.code !== "ENOENT") {
        console.error(e.message);
      }
    }

    let fixturesDir = path.join(directory, "fixtures");
    let fixtureContents = [];
    try {
      fixtureContents = await fs.readdir(fixturesDir);
    } catch (ignore) {}
    this.fixtures = await Promise.all(
      fixtureContents
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          let fixture = {
            document: await fs.readJSON(path.join(fixturesDir, file)),
          };
          if (this.schema) {
            let response = validate(fixture.document, this.schema);
            fixture.valid = response.success;
            if (!fixture.valid) {
              console.log(
                `Fixture ${file} does not validate against the schema.`
              );
            }
          }
          return fixture;
        })
    );

    let designDir = path.join(directory, "design");
    let designSubdirectories = [];
    try {
      designSubdirectories = await fs.readdir(designDir);
    } catch (e) {
      console.log(`No design directory found in ${directory}`);
    }
    this.designDocs = await Promise.all(
      designSubdirectories.map(async (dir) => {
        let ddoc = new DesignDoc(path.join(designDir, dir));
        await ddoc.load();
        return ddoc;
      })
    );
  };

  this.process = async (address) => {
    let nano = require("nano")(address);
    let dbExists = true;
    try {
      await nano.db.get(dbName);
    } catch (e) {
      if (!(e.error === "no_db_file")) {
        if (options.mode !== "inspect") {
          console.log(
            `Database ${dbName} does not exist. Will attempt to create it.`
          );
        }
        dbExists = false;
      } else {
        console.log(
          `Could not determine the status of database ${dbName}: ${e.error}`
        );
        return;
      }
    }

    if (!dbExists) {
      try {
        await nano.db.create(dbName);
      } catch (e) {
        console.log(`Could not create database ${dbName}: ${e.error}`);
      }
    }

    const db = nano.use(dbName);

    if (options.mode === "inspect") {
      try {
        await Promise.all(
          this.fixtures.map((fixture) => {
            if (options.insertInvalidFixtures || fixture.valid)
              db.insert(fixture.document);
          })
        );
      } catch (ignore) {}
    }

    await Promise.all(
      this.designDocs.map(async (ddoc) => {
        let rev;
        try {
          rev = (await db.get(ddoc.id))["_rev"];
        } catch (e) {
          if (!e.statusCode === 404) {
            console.log(
              `Could not determine status of design doc ${ddoc.id}: ${e.error}`
            );
          }
        }

        try {
          await db.insert(ddoc.docWithRev(rev));
        } catch (e) {
          console.log(`Could not insert design doc ${ddoc.id}: ${e.error}`);
        }
      })
    );

    console.log(`Database ${dbName} processed.`);
  };
};
