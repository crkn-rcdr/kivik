module.exports = function(doc, req) {
  provides("html", function() {
    if (doc && doc.title) {
      return "<p>The title of the book is: " + doc.title + "</p>";
    } else {
      return "<p>You need to provide a book id!</p>";
    }
  });
};
