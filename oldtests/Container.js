const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const getPort = require("get-port");

const Container = require("../src/Container");

describe("Container", function () {
  this.timeout(0);
  let container;

  it("should create a reachable Docker container", async () => {
    const port = await getPort();
    container = await Container.get(port);

    const nano = await container.start();

    nano.config.requestDefaults.auth.username.should.equal("kivik");
    nano.config.requestDefaults.auth.password.should.equal("kivik");

    nano.db.list().should.eventually.have.length(3);

    await container.stop();

    nano.db.list().should.eventually.throw();
  });

  after(async () => {
    try {
      await container.dockerInterface.stop();
      await container.dockerInterface.remove();
    } catch (_) {}
  });
});
