require("chai").should();
const Database = require("../src/Database");
const directory = "example/couch/testdb";

describe("DatabaseSet", () => {
  const db = new Database(directory);

  before(async () => {
    await db.load();
  });

  it("loads fixtures", async () => {
    db.should.have.property("fixtures");
    db.fixtures.should.have.length(4);
  });

  it("loads design docs", async () => {
    db.should.have.property("designDocs");
    db.designDocs.should.have.length(1);
    db.designDocs[0].id.should.equal("_design/test");
  });
});
