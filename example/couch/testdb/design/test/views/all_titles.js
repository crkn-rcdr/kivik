module.exports = exports = {
  map: function(doc) {
    if (doc.title) {
      emit(doc.title, null);
    }
    if (Array.isArray(doc.knownAs)) {
      doc.knownAs.forEach(function(t) {
        emit(t, null);
      });
    }
  },
  reduce: "_count"
};
