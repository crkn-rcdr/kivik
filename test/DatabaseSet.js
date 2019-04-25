require("chai").should();
const DatabaseSet = require("../src/DatabaseSet");
const directory = "example/couch";

describe("DatabaseSet", () => {
  const dset = new DatabaseSet(directory);

  before(async () => {
    await dset.load();
  });

  it("loads databases from a directory", async () => {
    dset.should.have.property("databases");
    dset.databases.should.have.length(1);
  });
});
