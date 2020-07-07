const chai = require("chai");
chai.use(require("chai-http"));
chai.should();
const Container = require("../src/Container");

describe("Container", function () {
  this.timeout(0);
  const container = new Container({ image: "couchdb:1.7", port: 22222 });

  before(async () => {
    await container.run();
  });

  it("should have a correctly set host URL", () => {
    container.hostURL().should.equal("http://localhost:22222/");
  });

  it("should start a reachable couchdb image", async () => {
    let response = await chai
      .request("http://localhost:22222")
      .get("/")
      .set("Accept", "application/json");
    response.status.should.equal(200);
    response.should.be.json;
    JSON.parse(response.text).should.have.property("couchdb", "Welcome");
  });

  after(async () => {
    await container.kill();
  });
});
