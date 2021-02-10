require("chai").should();

const Container = require("../src/Container");

describe("Container", function () {
  this.timeout(0);

  const container = new Container();
  let nano;

  before(async () => {
    nano = await container.start();
  });

  it("should start a reachable couchdb image", async () => {
    const dbs = await nano.db.list();
    dbs.should.include("_users");
    dbs.should.include("_replicator");
  });

  after(async () => {
    await container.stop();
  });
});
