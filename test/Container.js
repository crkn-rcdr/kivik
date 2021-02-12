require("chai").should();
const getPort = require("get-port");
const authedNano = require("../src/util").authedNano;

const Container = require("../src/Container");

describe("Container", function () {
  this.timeout(0);

  it("should create a reachable Docker container", async () => {
    const port = await getPort();
    const container = new Container(port);

    await container.start();

    const nano = authedNano(port, "kivikadmin", "kivikpassword");
    const dbs = await nano.db.list();

    await container.stop();

    dbs.should.include("_users");
    dbs.should.include("_replicator");
  });
});
