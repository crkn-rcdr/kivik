const getPort = require("get-port");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const should = chai.should();

const directory = "example";

const Container = require("../src/Container");
const Kivik = require("../src/Kivik");

describe("Kivik", function () {
  this.timeout(0);

  let kivik, container, nano, testdb;

  before(async () => {
    kivik = await Kivik.fromDirectory(directory);
    container = new Container(await getPort());
    nano = await container.start();
    testdb = nano.use("testdb");
  });

  const setupSuite = (directory, options) => {
    before(async () => {
      kivik = await Kivik.fromDirectory(directory, options);
    });

    beforeEach(async () => {
      await kivik.deploy(nano);
    });

    afterEach(async () => {
      await kivik.destroy(nano);
    });
  };

  describe("with defaults", function () {
    setupSuite(directory, {
      deployFixtures: true,
    });

    it("should load the validator", async () => {
      kivik.should.have.property("validator");
      kivik.validator.should.be.a("function");
    });

    it("should load databases", async () => {
      kivik.should.have.property("databases");
      kivik.databases.should.have.property("testdb");
      kivik.databases.should.have.property("seconddb");
    });

    it("should deploy fixtures", async () => {
      const ge = await testdb.get("great-expectations");
      ge.should.have.property("title");
      ge.title.should.equal("Great Expectations");
    });

    it("should only deploy the valid fixtures", async () => {
      testdb
        .get("bad-fixture")
        .should.eventually.throw()
        .with.property("statusCode", 404);
    });

    it("should deploy indexes", async () => {
      const indexesResponse = await nano.relax({
        db: "testdb",
        method: "get",
        path: "/_index",
      });
      indexesResponse.total_rows.should.equal(3);
      should.exist(
        indexesResponse.indexes.find((index) => index.name === "title")
      );
      should.exist(
        indexesResponse.indexes.find((index) => index.name === "custom-name")
      );
    });

    it("should allow for new documents to be posted", async () => {
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
  });

  describe("with a database subset", function () {
    setupSuite(directory, { include: ["seconddb"] });

    it("shouldn't load from databases not included in the subset", async () => {
      const list = await nano.db.list();
      list.should.not.include("testdb");
      list.should.include("seconddb");
    });
  });

  describe("with a database suffix", async () => {
    setupSuite(directory, { suffix: "test" });

    it("should add the database suffix to deployed database names", async () => {
      const list = await nano.db.list();
      list.should.not.include("testdb");
      list.should.include("testdb-test");
    });
  });

  describe("with a random database suffix", async () => {
    setupSuite(directory, { suffix: "random" });

    it("should generate and store a random suffix", async () => {
      const dbName = kivik.suffixedName("testdb");
      dbName.should.not.equal("testdb-random");
      const list = await nano.db.list();
      list.should.include(dbName);
    });
  });

  after(async () => {
    await container.stop();
  });
});
