require("chai").should();

const Instance = require("../src/Instance");

const directory = "example";

describe("Instance", function () {
  this.timeout(0);

  const instance = new Instance({ directory });
  let nano;

  before(async () => {
    nano = await instance.start();
  });

  it("should create and load a Kivik instance", async () => {
    instance.kivik.should.have.property("databases");
    instance.kivik.databases.should.have.property("testdb");
  });

  it("should create and start a reachable Container", async () => {
    const db = await nano.db.get("testdb");
    db.should.haveOwnProperty("db_name", "testdb");
  });

  after(async () => {
    await instance.stop();
  });
});
