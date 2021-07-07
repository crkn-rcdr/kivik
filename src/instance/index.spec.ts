import anyTest, { TestInterface } from "ava";

import { createInstance, getInstance, Instance } from ".";
import { directory } from "../example";

interface LocalContext {
	instance: Instance;
}

const test = anyTest as TestInterface<LocalContext>;

test.before(async (t) => {
	t.context = { instance: await createInstance(directory) };
});

test.serial("Can survive multiple deploys", async (t) => {
	const suffixes = Array.from({ length: 10 }, (_) =>
		Math.random().toString(36).substring(2)
	);
	await Promise.all(
		suffixes.map(async (suffix) => {
			const testdb = await t.context.instance.deployDb("testdb", suffix);
			const pickwick = await testdb.get("pickwick-papers");
			t.is(pickwick["_id"], "pickwick-papers");
		})
	);
});

test.serial("Can get a created instance", async (t) => {
	const instance = await getInstance(directory);
	const testdb = await instance.deployDb("testdb");
	const pickwick = await testdb.get("pickwick-papers");
	t.is(pickwick["_id"], "pickwick-papers");
});

test.after(async (t) => {
	await t.context.instance.stop();
});
