const chai = require("chai");
chai.use(require("chai-http"));
chai.should();

const Container = require("../src/Container");
const TestDeployer = require("../src/TestDeployer");

const server = "http://localhost:22222/";

describe("TestDeployer", function () {
  this.timeout(0);

  describe("with defaults", function () {
    let testDeployer, container;

    before(async () => {
      container = new Container({
        image: "couchdb:1.7",
        port: 22222,
        quiet: true,
      });
      await container.run();

      testDeployer = new TestDeployer("example", server);
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
      let response = await chai
        .request(server)
        .get("/testdb/great-expectations");
      response.status.should.equal(200);
    });

    it("should allow for new documents to be added", async () => {
      let testdb = require("nano")(server).use("testdb");
      await testdb.insert({
        _id: "not-a-real-book",
        title: "this isn't a real book",
        published: [2020],
      });
      let response = await chai.request(server).get("/testdb/not-a-real-book");
      response.status.should.equal(200);
    });

    it("should reset to a clean slate after each test", async () => {
      let response = await chai.request(server).get("/testdb/not-a-real-book");
      response.status.should.equal(404);
    });

    afterEach(async () => {
      await testDeployer.reset();
    });

    after(async () => {
      await container.kill();
    });
  });

  describe("with a database subset", function () {
    let testDeployer, container;

    before(async () => {
      container = new Container({
        image: "couchdb:1.7",
        port: 22222,
        quiet: true,
      });
      await container.run();

      testDeployer = new TestDeployer("example", server, ["seconddb"]);
      await testDeployer.load();
    });

    beforeEach(async () => {
      await testDeployer.deploy();
    });

    it("shouldn't load from databases not included in the subset", async () => {
      let response = await chai
        .request(server)
        .get("/testdb/great-expectations");
      response.status.should.equal(404);
    });

    afterEach(async () => {
      await testDeployer.reset();
    });

    after(async () => {
      await container.kill();
    });
  });
});
