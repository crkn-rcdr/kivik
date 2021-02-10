require("chai").should();
const Database = require("../src/Database");
const directory = require("path").resolve("example/testdb");

describe("Database", () => {
  const db = new Database(directory);

  before(async () => {
    await db.load();
  });

  it("loads the database schema", async () => {
    db.should.have.property("schema");
    db.schema.should.have.property("$schema");
  });

  it("loads fixtures", async () => {
    db.should.have.property("fixtures");
    db.fixtures.should.have.length(5);
  });

  it("validates fixtures", async () => {
    db.fixtures[0].valid.should.be.false;
    db.fixtures[1].valid.should.be.true;
    db.fixtures[1].document._id.should.equal("great-expectations");
  });

  it("loads design docs", async () => {
    db.should.have.property("designDocs");
    db.designDocs.should.have.length(1);
    db.designDocs[0].doc.should.have.property("views");
  });
});
