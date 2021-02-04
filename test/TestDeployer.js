const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const Container = require("../src/Container");
const TestDeployer = require("../src/TestDeployer");

const port = 22222;

describe("TestDeployer", function () {
  this.timeout(0);
  const container = new Container({ quiet: true, port });
  const testdb = container.agent.use("testdb");

  describe("with defaults", function () {
    const testDeployer = new TestDeployer("example", container.agent);

    before(async () => {
      await container.run();
      await testDeployer.load();
    });

    beforeEach(async () => {
      await testDeployer.deploy();
    });

    it("should load databases", async () => {
      testDeployer.databaseSet.should.have.property("databases");
      testDeployer.databaseSet.databases.should.have.length(2);
    });

    it("should load fixtures", async () => {
      const ge = await testdb.get("great-expectations");
      ge.should.haveOwnProperty("title");
      ge.title.should.equal("Great Expectations");
    });

    it("should allow for new documents to be added", async () => {
      await testdb.insert({
        _id: "not-a-real-book",
        title: "this isn't a real book",
        published: [2020],
      });

      const newbook = await testdb.get("not-a-real-book");
      newbook.should.haveOwnProperty("title");
      newbook.title.should.equal("this isn't a real book");
    });

    it("should reset to a clean slate after each test", async () => {
      testdb
        .get("not-a-real-book")
        .should.eventually.throw()
        .with.property("statusCode", 404);
    });

    afterEach(async () => {
      await testDeployer.reset();
    });

    after(async () => {
      await container.kill();
    });
  });

  describe("with a database subset", function () {
    const testDeployer = new TestDeployer("example", container.agent, [
      "seconddb",
    ]);

    before(async () => {
      await container.run();
      await testDeployer.load();
    });

    beforeEach(async () => {
      await testDeployer.deploy();
    });

    it("shouldn't load from databases not included in the subset", async () => {
      testdb
        .get("great-expectations")
        .should.eventually.throw()
        .with.property("statusCode", 404);
    });

    afterEach(async () => {
      await testDeployer.reset();
    });

    after(async () => {
      await container.kill();
    });
  });
});
