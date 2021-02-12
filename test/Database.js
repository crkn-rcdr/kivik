const should = require("chai").should();
const Database = require("../src/Database");
const directory = require("path").resolve("example/testdb");

describe("Database", () => {
  before(async () => {
    db = await Database.fromDirectory(directory, null, { excludeDesign: [] });
  });

  it("loads fixtures", async () => {
    db.should.have.property("fixtures");
    should.exist(db.fixtures.withId("great-expectations"));
  });

  it("loads indexes", async () => {
    db.should.have.property("indexes");
    should.exist(db.indexes.withName("title"));
  });

  it("loads design docs", async () => {
    db.should.have.property("designDocs");
    should.exist(db.designDocs.withId("_design/test"));
  });

  it("passes exclusiveDesign config to design docs", async () => {
    const doc = db.designDocs.withId("_design/test");
    doc.should.have.property("views");
    doc.views.should.have.property("all_titles.test");
  });
});
