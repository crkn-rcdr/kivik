const fs = require("fs-extra");
const path = require("path");

module.exports = exports = function DesignDoc(directory, rev) {
  this.directory = path.join(process.cwd(), directory);
  this.id = this.directory.slice(this.directory.lastIndexOf("/") + 1);
  this.oldRev = rev;

  this.representation = async () => {
    await this._load();
    let doc = {
      _id: `_design/${this.id}`,
      views: this.views
    };
    if (this.oldRev) doc["_rev"] = this.oldRev;
    return doc;
  };

  this._load = async () => {
    try {
      await this._importViews();
    } catch (e) {
      console.log(e);
    }
  };

  this._importViews = async () => {
    this.views = {};
    let viewsDir = path.join(this.directory, "views");
    for (viewFile of await fs.readdir(viewsDir)) {
      let viewObj = require(path.join(viewsDir, viewFile));
      let viewName = viewFile.slice(0, viewFile.lastIndexOf(".js"));
      this.views[viewName] = {
        map: viewObj.map.toString()
      };
      if (viewObj.reduce) {
        this.views[viewName].reduce = viewObj.reduce.toString();
      }
    }
  };
};
