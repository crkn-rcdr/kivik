const should = require("chai").should();

const getValidator = require("../src/getValidator");
const getExampleDir = require("./_getExampleDir");

const local = "example/testdb/fixtures/pickwick.json";
const remote =
  "https://raw.githubusercontent.com/crkn-rcdr/kivik/master/example/testdb/fixtures/pickwick.json";
const invalid = "example/testdb/fixtures/badfixture.json";

describe("Validator", function () {
  let validator, testdb;

  before(async () => {
    validator = await getValidator(getExampleDir());
    testdb = validator("testdb");
  });
  it("should return undefined if there is no schema for a key", () => {
    should.not.exist(validator("notakey"));
  });

  it("should validate a file", async () => {
    const response = await testdb(local);
    response.valid.should.be.true;
  });

  it("should validate a URL", async () => {
    const response = await testdb(remote);
    response.valid.should.be.true;
  });

  it("should validate an object", async () => {
    const response = await testdb({
      _id: "great-expectations",
      title: "Great Expectations",
      published: [1860, 1861],
    });
    response.valid.should.be.true;
  });

  it("should invalidate an invalid document", async () => {
    const response = await testdb(invalid);
    response.valid.should.be.false;
    response.errors.should.include("should be string");
  });
});
