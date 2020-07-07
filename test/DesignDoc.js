const path = require("path");
require("chai").should();
const DesignDoc = require("../src/DesignDoc");
const directory = path.resolve("example/testdb/design/test");
const emptyDirectory = path.resolve("example/testdb/design/empty");

describe("DesignDoc", () => {
  describe("With functions", () => {
    const ddoc = new DesignDoc(directory);
    let doc;

    before(async () => {
      await ddoc.load();
      doc = ddoc.doc;
    });

    it("should generate a design doc from a directory", async () => {
      ddoc.id.should.equal("_design/test");
      doc._id.should.equal("_design/test");
    });

    it("should load views from the views directory", async () => {
      doc.should.have.property("views");
      doc.views.should.have.property("all_titles");
      doc.views.all_titles.should.have.property("map");
      doc.views.all_titles.reduce.should.equal("_count");
    });

    it("should not load files not ending in .js", async () => {
      doc.should.have.property("views");
      doc.views.should.not.have.property("not_a_js_file");
      Object.keys(doc.views).length.should.equal(2);
    });

    it("should load updates from the updates directory", async () => {
      doc.should.have.property("updates");
      doc.updates.should.have.property("create_or_update");
    });

    it("should load shows from the shows directory", async () => {
      doc.should.have.property("shows");
      doc.shows.should.have.property("title_as_html");
    });

    it("should load lists from the lists directory", async () => {
      doc.should.have.property("lists");
      doc.lists.should.have.property("titles_as_html");
    });

    it("should load filters from the filters directory", async () => {
      doc.should.have.property("filters");
      doc.filters.should.have.property("multiple_titles");
    });
  });

  describe("With no functions", () => {
    const emptyDDoc = new DesignDoc(emptyDirectory);

    before(async () => {
      await emptyDDoc.load();
    });

    it("should load empty design document directories", async () => {
      emptyDDoc.doc._id.should.equal("_design/empty");
    });

    it("should not create function objects", async () => {
      emptyDDoc.doc.should.not.have.property("filters");
      emptyDDoc.doc.should.not.have.property("updates");
      emptyDDoc.doc.should.not.have.property("shows");
      emptyDDoc.doc.should.not.have.property("views");
      emptyDDoc.doc.should.not.have.property("lists");
    });
  });
});
