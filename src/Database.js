const fs = require("fs-extra");
const globby = require("globby");
const path = require("path");
const DesignDoc = require("./DesignDoc");

const keys = ["deployFixtures", "createDatabases", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function Database(directory, options = {}, validator = null) {
  options = withDefaults(options);

  this.name = directory.slice(directory.lastIndexOf(path.sep) + 1);

  this.validate = (_) => {
    return { valid: true, validationErrors: null };
  };

  this.hasSchema = false;

  this.loadSchema = async () => {
    if (validator) {
      const schemaFile = path.join(directory, "schema.json");
      let schema;

      try {
        schema = await fs.readJSON(schemaFile);
      } catch (e) {
        if (e.code !== "ENOENT") {
          console.error(e.message);
        } else {
          if (options.verbose > 0)
            console.log(
              `Database ${this.name} does not have a matching JSON schema.`
            );
        }
      }

      if (!schema) return;

      try {
        validator.addSchema(schema, this.name);
        this.hasSchema = true;
        this.validate = (document) => {
          const valid = validator.validate(this.name, document);
          return { valid, validationErrors: valid ? null : validator.errors };
        };
      } catch {
        console.error(`Error loading schema for database ${this.name}:`);
        console.error(validator.errorsText());
      }
    }

    return this;
  };

  this.loadFixtures = async () => {
    // TODO: use a stream here?
    const fixturePaths = await globby(
      path.posix.join(directory, "fixtures", "*.json"),
      { absolute: true }
    );

    this.fixtures = await Promise.all(
      fixturePaths.map(async (fp) => {
        const document = await fs.readJSON(fp);
        const response = this.validate(document);
        if (!response.valid && options.verbose > 0) {
          const file = fp.slice(fp.lastIndexOf(path.sep) + 1);
          console.log(
            `Fixture ${file} does not validate against the schema for database ${this.name}.`
          );
          console.log(validator.errorsText(response.validationErrors));
        }
        return { document, ...response };
      })
    );
  };

  this.loadDesign = async () => {
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

  this.load = async () => {
    await this.loadSchema();
    await this.loadFixtures();
    await this.loadDesign();
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
