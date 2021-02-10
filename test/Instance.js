const chai = require("chai");
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.should();

const Instance = require("../src/Instance");

const directory = "example";

describe("Instance", function () {
  this.timeout(0);

  const instance = new Instance({ directory });
  let exitStub, nano;

  before(async () => {
    exitStub = sinon.stub(process, "exit");
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
    exitStub.restore();
  });
});
