const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const getPort = require("get-port");

const Container = require("../src/Container");
const user = "kivikadmin";
const password = "kivikadmin";

describe("Container", function () {
  this.timeout(0);
  let container;

  it("should create a reachable Docker container", async () => {
    const port = await getPort();
    container = await Container.get(port, { user, password });

    const nano = await container.start();

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
