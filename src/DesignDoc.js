const fs = require("fs-extra");
const path = require("path");

const designTypes = {
  views: { mapReduce: true },
  updates: {}
};

module.exports = function DesignDoc(directory) {
  const fullDir = path.join(process.cwd(), directory);
  this.id = `_design/${fullDir.slice(fullDir.lastIndexOf("/") + 1)}`;

  const _importDir = async (type, mapReduce) => {
    let dir = path.join(fullDir, type);
    let obj = {};
    for (file of await fs.readdir(dir)) {
      let name = file.slice(0, file.lastIndexOf(".js"));
      let fileContents = require(path.join(dir, file));
      if (mapReduce) {
        // expect an object with a required map function and an optional reduce function
        obj[name] = { map: fileContents.map.toString() };
        if (fileContents.reduce) {
          obj[name].reduce = fileContents.reduce.toString();
        }
      } else {
        // expect a function
        obj[name] = fileContents.toString();
      }
    }
    return obj;
  };

  this.load = async () => {
    this.doc = { _id: this.id };
    for (type of Object.keys(designTypes)) {
      this.doc[type] = await _importDir(type, designTypes[type].mapReduce);
    }
  };

  this.docWithRev = rev => {
    let doc = {};
    if (rev) doc["_rev"] = rev;
    return Object.assign(doc, this.doc);
  };
};
