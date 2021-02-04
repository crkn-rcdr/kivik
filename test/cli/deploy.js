const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const Container = require("../../src/Container");
const handler = require("../../src/cli/deploy").handler;

const port = 22222;
const adminUser = "kivikadmin";
const adminPassword = "kivikpassword";

describe("Deploy mode handler", function () {
  this.timeout(0);

  describe("with defaults", function () {
    const container = new Container({
      port,
      quiet: true,
    });

    let deployer;

    before(async () => {
      await container.run();

      deployer = await handler({
        server: `http://localhost:${port}/`,
        "admin-user": adminUser,
        "admin-password": adminPassword,
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
      const db = await container.agent.db.get("testdb");
      db.should.haveOwnProperty("db_name", "testdb");
    });

    it("should not load fixtures", async () => {
      container.agent
        .use("testdb")
        .get("great-expectations")
        .should.eventually.throw()
        .with.property("statusCode", 404);
    });

    after(async () => {
      await container.kill();
    });
  });
});
