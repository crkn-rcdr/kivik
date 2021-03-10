const sinon = require("sinon");

const Logger = require("../../src/Logger");
const validate = require("../../src/cli/validate");
const getExampleDir = require("../_getExampleDir");

const logger = Logger.get();

const testdb = (document) => {
  return { directory: getExampleDir(), database: "testdb", document };
};

const local = getExampleDir("testdb", "fixtures", "pickwick.json");
const remote =
  "https://raw.githubusercontent.com/crkn-rcdr/kivik/master/example/testdb/fixtures/pickwick.json";
const invalid = getExampleDir("testdb", "fixtures", "badfixture.json");

describe("cli/validate", function () {
  beforeEach(() => {
    sinon.stub(process, "exit");
    sinon.stub(logger, "alert");
    sinon.stub(logger, "error");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should validate a file", async () => {
    await validate(testdb(local));
    sinon.assert.calledOnceWithExactly(process.exit, 0);
  });

  it("should validate a URL", async () => {
    await validate(testdb(remote));
    sinon.assert.calledOnceWithExactly(process.exit, 0);
  });

  it("should invalidate an invalid document", async () => {
    await validate(testdb(invalid));
    sinon.assert.calledOnceWithExactly(process.exit, 1);
    sinon.assert.calledWith(logger.error, sinon.match("should be string"));
  });
});
