const should = require("chai").should();

const path = require("path");
const Database = require("../src/Database");
const getValidator = require("../src/getValidator");
const getExampleDir = require("./_getExampleDir");

describe("Database", () => {
  before(async () => {
    const validate = (await getValidator(getExampleDir()))("testdb");
    db = await Database.fromDirectory(getExampleDir("testdb"), validate, {
      excludeDesign: [],
    });
  });

  it("provides a validator", async () => {
    db.validate.should.be.a("function");
  });

  it("loads fixtures", async () => {
    db.fixtures.should.be.a("object");
    db.fixtures.should.respondTo("withId");
    should.exist(db.fixtures.withId("great-expectations"));
    should.not.exist(db.fixtures.withId("bad-fixture"));
  });

  it("loads indexes", async () => {
    db.indexes.should.be.a("object");
    db.indexes.should.respondTo("withName");
    should.exist(db.indexes.withName("title"));
  });

  it("loads design docs", async () => {
    db.designDocs.should.be.a("object");
    db.designDocs.should.respondTo("withId");
    should.exist(db.designDocs.withId("_design/test"));
  });

  it("passes exclusiveDesign config to design docs", async () => {
    const doc = db.designDocs.withId("_design/test");
    doc.should.have.property("views");
    doc.views.should.have.property("all_titles.test");
  });
});
