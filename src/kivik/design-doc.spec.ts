import test from "ava";
import { JsonValue as JSONValue } from "type-fest";
import { join } from "path";

import { api as apiContext } from "../context";
import { directory } from "../example";
import { DesignDoc } from "./design-doc";
import { KivikFile, DesignFile } from "./file";

const designPath = (...args: string[]) =>
	join("testdb", "design", "test", ...args);

const ddoc = new DesignDoc(
	"test",
	apiContext(directory).withDatabase("testdb")
);

test("Constructs", (t) => {
	t.is(ddoc instanceof DesignDoc, true);
});

test("Can receive singleton", (t) => {
	const auFile = new KivikFile(
		designPath("autoupdate.js"),
		directory
	) as DesignFile;
	ddoc.updateFile(auFile);
	t.is(ddoc.content.has("autoupdate"), true);
});

test("Can receive named file", (t) => {
	const filterFile = new KivikFile(
		designPath("filters", "multiple_titles.js"),
		directory
	) as DesignFile;
	ddoc.updateFile(filterFile);
	t.is(ddoc.content.has("filters"), true);
	const filters = ddoc.content.get("filters") as Map<string, JSONValue>;
	t.is(filters.size, 1);
	t.is(filters.has("multiple_titles"), true);
});

test("Serializes", (t) => {
	const json = ddoc.serialize();
	t.is(Object.keys(json).length, 3);
	t.is(json._id, "_design/test");
});
