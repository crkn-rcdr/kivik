module.exports = {
	map: function (doc) {
		const aka = require("views/lib/prelude").aka;

		if (doc.title) {
			emit(doc.title, null);
		}

		if (Array.isArray(doc.knownAs)) {
			for (const title of doc.knownAs) {
				emit(aka(title), null);
			}
		}
	},
	reduce: "_count",
};
