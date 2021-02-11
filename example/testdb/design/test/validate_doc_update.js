module.exports = function (newDoc, oldDoc, userCtx, secObj) {
  if (!newDoc.title) {
    throw { forbidden: "doc.title is required" };
  }
};
