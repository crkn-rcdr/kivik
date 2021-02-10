const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const directory = "example";

const Container = require("../src/Container");
const Kivik = require("../src/Kivik");

describe("Kivik", function () {
  this.timeout(0);

  const container = new Container();
  let nano, testdb;

  before(async () => {
    nano = await container.start();
    testdb = nano.use("testdb");
  });

  describe("with defaults", function () {
    const kivik = new Kivik({
      directory,
      deployFixtures: true,
    });

    before(async () => {
      await kivik.load();
    });

    beforeEach(async () => {
      await kivik.deploy(nano);
    });

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
      await kivik.reset(nano);
    });
  });

  describe("with a database subset", function () {
    const kivik = new Kivik({
      directory,
      include: ["seconddb"],
      deployFixtures: true,
    });

    before(async () => {
      await kivik.load();
    });

    beforeEach(async () => {
      await kivik.deploy(nano);
    });

    it("shouldn't load from databases not included in the subset", async () => {
      testdb
        .get("great-expectations")
        .should.eventually.throw()
        .with.property("statusCode", 404);
    });

    afterEach(async () => {
      await kivik.reset(nano);
    });
  });

  after(async () => {
    await container.stop();
  });
});
