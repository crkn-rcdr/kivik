const fs = require("fs-extra");
const path = require("path");
const validate = require("./validate");
const DesignDoc = require("./DesignDoc");

const keys = ["deployFixtures", "createDatabases", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function Database(directory, options = {}) {
  options = withDefaults(options);

  this.name = directory.slice(directory.lastIndexOf(path.sep) + 1);

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
              if (options.verbose > 0)
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
      if (options.verbose > 0)
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

  this.deploy = async (nanoInstance) => {
    let dbExists = true;
    try {
      await nanoInstance.db.get(this.name);
    } catch (e) {
      if (!(e.message === "no_db_file")) {
        dbExists = false;
      } else {
        console.error(
          `Could not determine the status of database ${this.name}: ${e.message}`
        );
        return;
      }
    }

    if (!dbExists) {
      if (options.createDatabases) {
        if (options.verbose > 0) {
          console.log(
            `Database ${this.name} does not exist. Will attempt to create it.`
          );
        }
        try {
          await nanoInstance.db.create(this.name);
        } catch (e) {
          console.error(`Could not create database ${this.name}: ${e.message}`);
        }
      } else {
        console.error(`Database ${this.name} does not exist.`);
        return;
      }
    }

    const db = nanoInstance.use(this.name);

    if (options.deployFixtures) {
      try {
        await Promise.all(
          this.fixtures.map((fixture) =>
            fixture.valid ? db.insert(fixture.document) : null
          )
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
              `Could not determine status of design doc ${ddoc.id}: ${e.message}`
            );
          }
        }

        try {
          await db.insert(ddoc.docWithRev(rev));
        } catch (e) {
          console.error(`Could not insert design doc ${ddoc.id}: ${e.message}`);
        }
      })
    );

    if (options.verbose > 0) console.log(`Database ${this.name} deployed.`);
  };
};
