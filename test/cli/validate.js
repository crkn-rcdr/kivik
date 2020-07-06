const chai = require("chai");
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.should();

const handler = require("../../src/cli/validate").handler;

const githubJsonUrl =
  "https://raw.githubusercontent.com/crkn-rcdr/kivik/master/example/testdb/fixtures/pickwick.json";

describe("Validate mode handler", function () {
  let exitStub;

  before(() => {
    exitStub = sinon.stub(process, "exit");
  });

  it("should validate a file against a directory", async () => {
    await handler({
      document: "example/testdb/fixtures/pickwick.json",
      schema: "example/testdb",
    });
    exitStub.should.have.been.calledWith(0);
  });

  it("should validate a file against a file", async () => {
    await handler({
      document: "example/testdb/fixtures/pickwick.json",
      schema: "example/testdb/schema.json",
    });
    exitStub.should.have.been.calledWith(0);
  });

  it("should validate a URL against a directory", async () => {
    await handler({
      document: githubJsonUrl,
      schema: "example/testdb",
    });
    exitStub.should.have.been.calledWith(0);
  });

  it("should invalidate an invalid document", async () => {
    await handler({
      document: "example/testdb/fixtures/badfixture.json",
      schema: "example/testdb",
    });
    exitStub.should.have.been.calledWith(1);
  });

  after(() => {
    exitStub.restore();
  });
});
