const chai = require("chai");
chai.use(require("chai-http"));
chai.should();

const handler = require("../../src/cli/inspect").handler;

describe("Inspect mode handler", function () {
  this.timeout(0);

  describe("with defaults", function () {
    let instance;

    before(async () => {
      instance = await handler({
        image: "couchdb:1.7",
        port: 22222,
        "couch-output": false,
        db: ["testdb"],
        directory: "example",
        "insert-invalid-fixtures": false,
        quiet: true,
      });
    });

    it("should load databases", async () => {
      instance.databaseSet.should.have.property("databases");
      instance.databaseSet.databases.should.have.length(1);
    });

    it("should be accessible via http", async () => {
      let response = await chai
        .request("http://localhost:22222/")
        .get("/testdb")
        .set("Accept", "application/json");
      response.status.should.equal(200);
      response.should.be.json;
    });

    it("should load only the valid fixtures", async () => {
      let response = await chai
        .request("http://localhost:22222")
        .get("/testdb/_all_docs")
        .set("Accept", "application/json");
      response.status.should.equal(200);
      response.body.rows.length.should.equal(5);
      response.body.rows[1].id.should.equal("great-expectations");
    });

    after(async () => {
      await instance.kill();
    });
  });
});
