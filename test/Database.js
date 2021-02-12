require("chai").should();
const Database = require("../src/Database");
const directory = require("path").resolve("example/testdb");

describe("Database", () => {
  before(async () => {
    db = await Database.fromDirectory(directory, { excludeDesign: [] });
  });

  it("loads fixtures", async () => {
    db.should.have.property("fixtures");
    Object.keys(db.fixtures).should.have.length(5);
  });

  it("loads indexes", async () => {
    db.should.have.property("indexes");
    db.indexes.should.have.property("title");
    db.indexes.title.should.have.property("name");
    db.indexes.title.name.should.equal("title");
    db.indexes.should.have.property("fully_specified");
  });

  it("loads design docs", async () => {
    db.should.have.property("designDocs");
    db.designDocs.should.have.property("_design/test");
  });

  it("passes exclusiveDesign config to design docs", async () => {
    const doc = db.designDocs["_design/test"].doc();
    doc.should.have.property("views");
    doc.views.should.have.property("all_titles.test");
  });
});
