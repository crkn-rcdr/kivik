const fs = require("fs-extra");
const path = require("path");

const designTypes = {
  views: { mapReduce: true },
  shows: {},
  lists: {},
  updates: {},
  filters: {}
};

module.exports = function DesignDoc(directory) {
  this.id = `_design/${directory.slice(directory.lastIndexOf("/") + 1)}`;

  const _importDir = async (type, mapReduce) => {
    let dir = path.join(directory, type);
    let dirContents;
    try {
      dirContents = await fs.readdir(dir);
    } catch (err) {
      if (!err.code === "ENOENT") throw err;
      return null;
    }

    let obj = {};
    dirContents.forEach(file => {
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
    });
    return obj;
  };

  this.load = async () => {
    this.doc = { _id: this.id };
    await Promise.all(
      Object.keys(designTypes).map(async type => {
        let functionObj = await _importDir(type, designTypes[type].mapReduce);
        if (functionObj) this.doc[type] = functionObj;
      })
    );
  };

  this.docWithRev = rev => {
    let doc = {};
    if (rev) doc["_rev"] = rev;
    return Object.assign(doc, this.doc);
  };
};
