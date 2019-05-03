module.exports = function(doc, req) {
  return (
    "knownAs" in doc && Array.isArray(doc.knownAs) && doc.knownAs.length > 0
  );
};
