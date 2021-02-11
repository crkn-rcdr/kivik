const getPort = require("get-port");
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const directory = "example";

const Container = require("../src/Container");
const Kivik = require("../src/Kivik");

describe("Kivik", function () {
  this.timeout(0);

  let container, nano, testdb;

  before(async () => {
    container = new Container(await getPort());
    nano = await container.start();
    testdb = nano.use("testdb");
  });

  const setupSuite = (kivik) => {
    before(async () => {
      await kivik.load();
    });

    beforeEach(async () => {
      await kivik.deploy(nano);
    });

    afterEach(async () => {
      await kivik.reset(nano);
    });
  };

  describe("with defaults", function () {
    const kivik = new Kivik({
      directory,
      deployFixtures: true,
    });

    setupSuite(kivik);

    it("should load databases", async () => {
      kivik.should.have.property("databases");
      kivik.databases.should.have.property("testdb");
      kivik.databases.should.have.property("seconddb");
    });

    it("should load fixtures", async () => {
      const ge = await testdb.get("great-expectations");
      ge.should.haveOwnProperty("title");
      ge.title.should.equal("Great Expectations");
    });

    it("should load only the valid fixtures", async () => {
      testdb
        .get("bad-fixture")
        .should.eventually.throw()
        .with.property("statusCode", 404);
    });

    it("should post indexes", async () => {
      const indexesResponse = await nano.relax({
        db: "testdb",
        method: "get",
        path: "/_index",
      });
      indexesResponse.total_rows.should.equal(3);
      indexesResponse.indexes.find((index) => index.name === "title").should.not
        .be.undefined;
      indexesResponse.indexes.find((index) => index.name === "custom-name")
        .should.not.be.undefined;
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
  });

  describe("with a database subset", function () {
    const kivik = new Kivik({
      directory,
      include: ["seconddb"],
    });

    setupSuite(kivik);

    it("shouldn't load from databases not included in the subset", async () => {
      const list = await nano.db.list();
      list.should.not.include("testdb");
      list.should.include("seconddb");
    });
  });

  describe("with a database suffix", async () => {
    const kivik = new Kivik({ directory, suffix: "test" });

    setupSuite(kivik);

    it("should add the database suffix to deployed database names", async () => {
      const list = await nano.db.list();
      list.should.not.include("testdb");
      list.should.include("testdb-test");
    });
  });

  describe("with a random database suffix", async () => {
    const kivik = new Kivik({ directory, suffix: "random" });
    const dbName = kivik.dbName("testdb");

    setupSuite(kivik);

    it("should generate and store a random suffix", async () => {
      dbName.should.not.equal("testdb-random");
      const list = await nano.db.list();
      list.should.include(dbName);
    });
  });

  after(async () => {
    await container.stop();
  });
});
