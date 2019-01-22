module.exports = exports = {
  map: function(doc) {
    if (Array.isArray(doc.published)) {
      if (doc.published.length == 2) {
        emit(doc.published[1], doc);
      } else {
        emit(doc.published[0], doc);
      }
    } else {
      emit(doc.published, doc);
    }
  }
};
