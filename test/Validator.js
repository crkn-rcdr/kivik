const chai = require("chai");
chai.should();

const Validator = require("../src/Validator");

const directory = "example";

const local = "example/testdb/fixtures/pickwick.json";
const remote =
  "https://raw.githubusercontent.com/crkn-rcdr/kivik/master/example/testdb/fixtures/pickwick.json";
const invalid = "example/testdb/fixtures/badfixture.json";

describe("Validator", function () {
  const validator = new Validator({ directory });

  it("should validate a file", async () => {
    const response = await validator.validate(local, "testdb");
    response.valid.should.be.true;
  });

  it("should validate a URL", async () => {
    const response = await validator.validate(remote, "testdb");
    response.valid.should.be.true;
  });

  it("should invalidate an invalid document", async () => {
    const response = await validator.validate(invalid, "testdb");
    response.valid.should.be.false;
  });
});
