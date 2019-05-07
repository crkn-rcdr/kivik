require("chai").should();
const Database = require("../src/Database");
const directory = require("path").resolve("example/testdb");

describe("Database", () => {
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
    db.designDocs.should.have.length(2);
    db.designDocs[1].doc.should.have.property("views");
  });
});
