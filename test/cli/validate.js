const chai = require("chai");
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.should();

const handler = require("../../src/cli/validate").handler;

const directory = "example";

const githubJsonUrl =
  "https://raw.githubusercontent.com/crkn-rcdr/kivik/master/example/testdb/fixtures/pickwick.json";

describe("Validate mode handler", function () {
  let exitStub, consoleLogStub, consoleErrorStub;

  before(() => {
    exitStub = sinon.stub(process, "exit");
    consoleLogStub = sinon.stub(console, "log");
    consoleErrorStub = sinon.stub(console, "error");
  });

  it("should validate a file", async () => {
    await handler({
      directory,
      document: "example/testdb/fixtures/pickwick.json",
      db: "testdb",
    });
    exitStub.should.have.been.calledWith(0);
  });

  it("should validate a URL", async () => {
    await handler({
      document: githubJsonUrl,
      db: "testdb",
    });
    exitStub.should.have.been.calledWith(0);
  });

  it("should invalidate an invalid document", async () => {
    await handler({
      document: "example/testdb/fixtures/badfixture.json",
      db: "testdb",
    });
    exitStub.should.have.been.calledWith(1);
  });

  after(() => {
    exitStub.restore();
    consoleLogStub.restore();
    consoleErrorStub.restore();
  });
});
