const fs = require("fs-extra");
const globby = require("globby");
const path = require("path");
const DesignDoc = require("./DesignDoc");

const keys = ["deployFixtures", "excludeDesign", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function Database(directory, options = {}, validator = null) {
  options = withDefaults(options);

  this.name = directory.slice(directory.lastIndexOf(path.sep) + 1);

  this.validate = (_) => {
    return { valid: true, validationErrors: null };
  };

  this.fixtures = [];
  this.indexes = [];
  this.designDocs = [];

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
            `Fixture ${file} does not validate against the schema for database ${this.name}:`,
            validator.errorsText(response.validationErrors)
          );
        }
        return { document, ...response };
      })
    );
  };

  this.loadIndexes = async () => {
    const indexPaths = await globby(
      path.posix.join(directory, "indexes", "*.json"),
      { absolute: true }
    );

    this.indexes = await Promise.all(
      indexPaths.map(async (ip) => {
        const name = ip.slice(
          ip.lastIndexOf(path.sep) + 1,
          ip.lastIndexOf(".json")
        );
        const index = await fs.readJSON(ip);
        if (!index.name) index.name = name;
        if (!index.ddoc) index.ddoc = `index_${name}`;
        return index;
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
        let ddoc = new DesignDoc(path.join(designDir, dir), options);
        await ddoc.load();
        return ddoc;
      })
    );
  };

  this.load = async () => {
    await this.loadSchema();
    await this.loadFixtures();
    await this.loadIndexes();
    await this.loadDesign();
  };

  this.deploy = async (nanoInstance, name = this.name) => {
    let dbExists = true;
    try {
      await nanoInstance.db.get(name);
    } catch (e) {
      if (!(e.message === "no_db_file")) {
        dbExists = false;
      } else {
        console.error(
          `Could not determine the status of database ${name}: ${e.message}`
        );
        return;
      }
    }

    if (!dbExists) {
      try {
        await nanoInstance.db.create(name);
      } catch (e) {
        console.error(`Could not create database ${name}: ${e.message}`);
      }
    }

    const db = nanoInstance.use(name);

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
      this.indexes.map(async (index) => {
        nanoInstance.relax({
          db: name,
          path: "/_index",
          method: "post",
          body: index,
        });
      })
    );

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

    if (options.verbose > 0) console.log(`Database ${name} deployed.`);
  };
};
