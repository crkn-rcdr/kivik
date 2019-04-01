const fs = require("fs-extra");
const path = require("path");

const designTypes = {
  views: { mapReduce: true },
  updates: {}
};

module.exports = exports = function DesignDoc(directory, currentRev) {
  const fullDir = path.join(process.cwd(), directory);
  const id = fullDir.slice(fullDir.lastIndexOf("/") + 1);

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

  this.representation = async () => {
    let doc = { _id: `_design/${id}` };
    if (currentRev) doc["_rev"] = currentRev;
    for (type of Object.keys(designTypes)) {
      doc[type] = await _importDir(type, designTypes[type].mapReduce);
    }
    return doc;
  };
};
