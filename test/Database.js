const Ajv = require("ajv").default;
const addFormats = require("ajv-formats");
require("chai").should();
const Database = require("../src/Database");
const directory = require("path").resolve("example/testdb");

describe("Database", () => {
  const ajv = new Ajv();
  addFormats(ajv);
  const db = new Database(directory, { excludeDesign: [] }, ajv);

  before(async () => {
    await db.load();
  });

  it("loads the database schema", async () => {
    db.hasSchema.should.equal(true);
  });

  it("loads fixtures", async () => {
    db.should.have.property("fixtures");
    db.fixtures.should.have.length(5);
  });

  it("validates fixtures", async () => {
    const invalidFixture = db.fixtures.find(
      (fixture) => fixture.document._id === "bad-fixture"
    );
    const validFixture = db.fixtures.find(
      (fixture) => fixture.document._id === "great-expectations"
    );

    invalidFixture.valid.should.be.false;
    validFixture.valid.should.be.true;
  });

  it("loads indexes", async () => {
    db.should.have.property("indexes");
    db.indexes.should.have.length(2);
  });

  it("loads design docs", async () => {
    db.should.have.property("designDocs");
    db.designDocs.should.have.length(1);
  });

  it("passes exclusiveDesign config to design docs", async () => {
    db.designDocs[0].doc.should.have.property("views");
    db.designDocs[0].doc.views.should.have.property("all_titles.test");
  });
});
