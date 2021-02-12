const path = require("path");
require("chai").should();
const DesignDoc = require("../src/DesignDoc");
const directory = path.resolve("example/testdb/design/test");
const emptyDirectory = path.resolve("example/testdb/design/empty");

describe("DesignDoc", () => {
  let id, doc;

  describe("With functions", () => {
    before(async () => {
      const ddoc = await DesignDoc.fromDirectory(directory);
      id = ddoc.id();
      doc = (await DesignDoc.fromDirectory(directory)).doc();
    });

    it("should generate a design doc from a directory", async () => {
      id.should.equal("_design/test");
    });

    it("should load views from the views directory", async () => {
      doc.should.have.property("views");
      doc.views.should.have.property("all_titles");
      doc.views.all_titles.should.have.property("map");
      doc.views.all_titles.reduce.should.equal("_count");
    });

    it("should not load files excluded by the excludeDesign argument", async () => {
      doc.views.should.not.have.property("all_titles.test");
    });

    it("should not load files not ending in .js", async () => {
      doc.should.have.property("views");
      doc.views.should.not.have.property("not_a_js_file");
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

    it("should load a validate_doc_update function", async () => {
      doc.should.have.property("validate_doc_update");
      doc.validate_doc_update.should.have.string("forbidden");
    });

    it("should load an autoupdate boolean", async () => {
      doc.should.have.property("autoupdate");
      doc.autoupdate.should.equal(false);
    });
  });

  describe("With no functions", () => {
    before(async () => {
      doc = (await DesignDoc.fromDirectory(emptyDirectory)).doc();
    });

    it("should load empty design document directories", async () => {
      doc._id.should.equal("_design/empty");
    });

    it("should not create function objects", async () => {
      doc.should.not.have.property("filters");
      doc.should.not.have.property("updates");
      doc.should.not.have.property("shows");
      doc.should.not.have.property("views");
      doc.should.not.have.property("lists");
    });
  });

  describe("With excludeDesign set", () => {
    before(async () => {
      doc = (
        await DesignDoc.fromDirectory(directory, {
          excludeDesign: [],
        })
      ).doc();
    });

    it("should include all .js files", async () => {
      doc.views.should.have.property("all_titles.test");
    });
  });
});
