const chai = require("chai");
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.should();

const handler = require("../../src/cli/inspect").handler;

const port = 22222;

describe("Inspect mode handler", function () {
  this.timeout(0);

  describe("with defaults", function () {
    let exitStub, instance;

    before(async () => {
      exitStub = sinon.stub(process, "exit");

      instance = await handler({
        directory: "example",
        image: "couchdb:3.1",
        port,
        "couch-output": false,
        db: ["testdb"],
        "insert-invalid-fixtures": false,
        quiet: true,
      });
    });

    it("should load databases", async () => {
      instance.databaseSet.should.have.property("databases");
      instance.databaseSet.databases.should.have.length(1);
    });

    it("should be accessible via http", async () => {
      const db = await instance.container.agent.db.get("testdb");
      db.should.haveOwnProperty("db_name", "testdb");
    });

    it("should load only the valid fixtures", async () => {
      const response = await instance.container.agent.use("testdb").list();

      const docs = response.rows.filter((doc) => {
        return !doc.id.startsWith("_design");
      });

      docs.length.should.equal(4);
      docs[0].id.should.equal("great-expectations");
    });

    after(async () => {
      await instance.kill();
      exitStub.restore();
    });
  });
});
