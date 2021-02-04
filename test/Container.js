require("chai").should();

const Container = require("../src/Container");

describe("Container", function () {
  this.timeout(0);
  const container = new Container({
    port: 22222,
    quiet: true,
  });

  before(async () => {
    await container.run();
  });

  it("should start a reachable couchdb image", async () => {
    const dbs = await container.agent.db.list();
    dbs.should.include("_users");
    dbs.should.include("_replicator");
  });

  after(async () => {
    await container.kill();
  });
});
