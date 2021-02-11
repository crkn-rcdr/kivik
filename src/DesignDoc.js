const fs = require("fs-extra");
const path = require("path");
const globby = require("globby");

// Object.fromEntries is Node 12+
const objectFromEntries = (entries) => {
  const obj = {};
  for (const [key, value] of entries) {
    obj[key] = value;
  }
  return obj;
};

const designTypes = {
  views: { multi: true, type: "object" },
  shows: { multi: true, type: "function" },
  lists: { multi: true, type: "function" },
  updates: { multi: true, type: "function" },
  filters: { multi: true, type: "function" },
  validate_doc_update: { multi: false, type: "function" },
  autoupdate: { multi: false, type: "boolean" },
};

const withDefaults = require("./options").withDefaults(["excludeDesign"]);

module.exports = function DesignDoc(directory, options = {}) {
  const { excludeDesign } = withDefaults(options);

  this.id = `_design/${directory.slice(directory.lastIndexOf(path.sep) + 1)}`;
  this.doc = { _id: this.id };

  const _import = async (design) => {
    const info = designTypes[design];
    const designPath = path.join(directory, design);
    if (info.multi) {
      const exists = await fs.pathExists(designPath);
      if (!exists) return null;

      const files = await globby("*.js", {
        ignore: excludeDesign,
        cwd: designPath,
        absolute: true,
      });

      const entries = files.map((filePath) => {
        const key = filePath.slice(
          filePath.lastIndexOf(path.sep) + 1,
          filePath.lastIndexOf(".js")
        );
        const module = require(filePath);
        if (info.type === "object") {
          return [
            key,
            objectFromEntries(
              Object.entries(module).map((entry) => [
                entry[0],
                entry[1].toString(),
              ])
            ),
          ];
        } else {
          return [key, module.toString()];
        }
      });

      return entries.length > 0 ? objectFromEntries(entries) : null;
    } else {
      try {
        const module = require(designPath);
        return info.type === "boolean" ? !!module : module.toString();
      } catch {
        return null;
      }
    }
  };

  this.load = async () => {
    await Promise.all(
      Object.keys(designTypes).map(async (design) => {
        let rv = await _import(design);
        if (rv !== null) this.doc[design] = rv;
      })
    );
  };

  this.docWithRev = (rev) => {
    let doc = {};
    if (rev) doc["_rev"] = rev;
    return Object.assign(doc, this.doc);
  };
};
