module.exports = {
	map: function (doc) {
		if (Array.isArray(doc.published)) {
			if (doc.published.length == 2) {
				emit(doc.published[1], null);
			} else {
				emit(doc.published[0], null);
			}
		} else {
			emit(doc.published, null);
		}
	},
};
