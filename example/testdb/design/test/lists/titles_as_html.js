module.exports = function(head, req) {
  provides("html", function() {
    send("<p>Some Dickens book titles:</p>");
    send("<ul>");
    while ((row = getRow())) {
      send("<li>" + toJSON(row.key) + "</li>");
    }
    send("</ul>");
  });
};
