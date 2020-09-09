const chai = require("chai");
chai.use(require("chai-http"));
chai.should();

const Container = require("../../src/Container");
const handler = require("../../src/cli/deploy").handler;

describe("Deploy mode handler", function () {
  this.timeout(0);

  describe("with defaults", function () {
    let deployer, container;

    before(async () => {
      container = new Container({
        image: "couchdb:1.7",
        port: 22222,
        quiet: true,
      });
      await container.run();

      deployer = await handler({
        server: "http://localhost:22222/",
        directory: "example",
        db: ["testdb"],
        "create-databases": true,
        quiet: true,
      });
    });

    it("should load databases", async () => {
      deployer.databaseSet.should.have.property("databases");
      deployer.databaseSet.databases.should.have.length(1);
    });

    it("should be accessible via http", async () => {
      let response = await chai
        .request("http://localhost:22222/")
        .get("/testdb")
        .set("Accept", "application/json");
      response.status.should.equal(200);
      response.should.be.json;
    });

    it("should not load fixtures", async () => {
      let response = await chai
        .request("http://localhost:22222/")
        .get("/testdb/great-expectations");
      response.status.should.equal(404);
    });

    after(async () => {
      await container.kill();
    });
  });
});
