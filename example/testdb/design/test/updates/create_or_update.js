module.exports = function(doc, req) {
  var created = false;
  if (!doc) {
    if ("id" in req && req["id"]) {
      doc = { _id: req["id"] };
      created = true;
    } else {
      return [null, "Cannot create a new document without an id"];
    }
  }

  var body;
  try {
    body = JSON.parse(req.body);
  } catch (e) {
    return [null, "Request body is not valid JSON:\n" + e.message];
  }

  ["title", "knownAs", "published"].forEach(function(key) {
    if (body[key]) {
      doc[key] = body[key];
    }
  });

  if (created) {
    return [doc, "Document " + doc["_id"] + " created"];
  } else {
    return [doc, "Document " + doc["_id"] + "updated"];
  }
};
