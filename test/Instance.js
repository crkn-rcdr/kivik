require("chai").should();

const Instance = require("../src/Instance");

const directory = "example";

describe("Instance", function () {
  this.timeout(0);

  let instance;

  before(async () => {
    instance = await Instance.get(directory);
    await instance.start();
    await instance.deploy();
  });

  it("should create and load a Kivik instance", async () => {
    instance.kivik.should.have.property("databases");
    instance.kivik.databases.should.have.property("testdb");
  });

  it("should create and start a reachable Container", async () => {
    const db = await instance.nano.db.get("testdb");
    db.should.haveOwnProperty("db_name", "testdb");
  });

  after(async () => {
    await instance.stop();
  });
});
