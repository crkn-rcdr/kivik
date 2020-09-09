const fs = require("fs-extra");
const path = require("path");
const validate = require("./validate");
const DesignDoc = require("./DesignDoc");

// options can include:
// fixtures: deploy fixtures to databases
// invalidFixtures: deploy fixtures to databases that do not validate
// createDatabases: create databases when they do not exist
// quiet: suppress console.log
module.exports = function Database(directory, options) {
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

  this.dbName = directory.slice(directory.lastIndexOf("/") + 1);

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
              if (!options.quiet)
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
      if (!options.quiet)
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

  this.deploy = async (address) => {
    let nano = require("nano")(address);
    let dbExists = true;
    try {
      await nano.db.get(this.dbName);
    } catch (e) {
      if (!(e.error === "no_db_file")) {
        dbExists = false;
      } else {
        console.error(
          `Could not determine the status of database ${this.dbName}: ${e.error}`
        );
        return;
      }
    }

    if (!dbExists) {
      if (options.createDatabases) {
        if (!options.quiet) {
          console.log(
            `Database ${this.dbName} does not exist. Will attempt to create it.`
          );
        }
        try {
          await nano.db.create(this.dbName);
        } catch (e) {
          console.error(`Could not create database ${this.dbName}: ${e.error}`);
        }
      } else {
        console.error(`Database ${this.dbName} does not exist.`);
        return;
      }
    }

    const db = nano.use(this.dbName);

    if (options.fixtures) {
      try {
        await Promise.all(
          this.fixtures.map((fixture) => {
            if (options.invalidFixtures || fixture.valid)
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
            console.error(
              `Could not determine status of design doc ${ddoc.id}: ${e.error}`
            );
          }
        }

        try {
          await db.insert(ddoc.docWithRev(rev));
        } catch (e) {
          console.error(`Could not insert design doc ${ddoc.id}: ${e.error}`);
        }
      })
    );

    if (!options.quiet) console.log(`Database ${this.dbName} deployed.`);
  };
};
