import test from "ava";
import { join } from "path";

import { KivikFile } from "./file";
import { directory } from "../example";

test("Can require JS booleans", (t) => {
	const boolFile = new KivikFile(
		join("testdb", "design", "test", "autoupdate.js"),
		directory
	);
	t.is(typeof boolFile.content, "boolean");
});

test("Can require JSON objects", (t) => {
	const objFile = new KivikFile(
		join("testdb", "fixtures", "pickwick.json"),
		directory
	);
	t.is(typeof objFile.content, "object");
});

test("Can require JS functions", (t) => {
	const funcFile = new KivikFile(
		join("testdb", "design", "test", "updates", "create_or_update.js"),
		directory
	);
	t.is(typeof funcFile.content, "function");
	t.is(typeof funcFile.serialize(), "string");
});

test("Can require JS objects", (t) => {
	const viewFile = new KivikFile(
		join("testdb", "design", "test", "views", "all_titles.js"),
		directory
	);
	t.is(typeof viewFile.content, "object");
	t.is(
		Object.values(viewFile.serialize() as Record<string, string>).every(
			(val) => typeof val === "string"
		),
		true
	);
});
