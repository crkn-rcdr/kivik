const chai = require("chai");
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.should();

const Instance = require("../src/Instance");

const directory = "example";

describe("Instance", function () {
  this.timeout(0);

  describe("with defaults", function () {
    const instance = new Instance({ directory, include: ["testdb"] });
    let exitStub, nano;

    before(async () => {
      exitStub = sinon.stub(process, "exit");
      nano = await instance.start();
    });

    it("should load databases", async () => {
      instance.kivik.should.have.property("databases");
      instance.kivik.databases.should.have.property("testdb");
      instance.kivik.databases.should.not.have.property("seconddb");
    });

    it("should be accessible via http", async () => {
      const db = await nano.db.get("testdb");
      db.should.haveOwnProperty("db_name", "testdb");
    });

    it("should load only the valid fixtures", async () => {
      const response = await nano.use("testdb").list();

      const docs = response.rows.filter((doc) => {
        return !doc.id.startsWith("_design");
      });

      docs.length.should.equal(4);
      docs[0].id.should.equal("great-expectations");
    });

    after(async () => {
      await instance.stop();
      exitStub.restore();
    });
  });
});
