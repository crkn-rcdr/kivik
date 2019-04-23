require("chai").should();
const DesignDoc = require("../src/DesignDoc");
const directory = "example/couch/testdb/design/test";

describe("DesignDoc", () => {
  const ddoc = new DesignDoc(directory);
  let doc;

  before(async () => {
    doc = await ddoc.representation();
  });

  it("should generate a design doc from a directory", async () => {
    doc._id.should.equal("_design/test");
  });

  it("should load views from the views directory", async () => {
    doc.should.have.property("views");
    doc.views.should.have.property("all_titles");
    doc.views.all_titles.should.have.property("map");
    doc.views.all_titles.reduce.should.equal("_count");
  });

  it("should load updates from the updates directory", async () => {
    doc.should.have.property("updates");
    doc.updates.should.have.property("create_or_update");
  });
});
