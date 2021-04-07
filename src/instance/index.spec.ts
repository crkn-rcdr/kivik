import anyTest, { TestInterface } from "ava";

import { createInstance, Instance } from ".";
import { directory } from "../example";
import { DatabaseHandler } from "../kivik";

interface LocalContext {
	instance: Instance;
}

const test = anyTest as TestInterface<LocalContext>;

test.before(async (t) => {
	t.context = { instance: await createInstance(directory) };
});

test("Can survive multiple deploys", async (t) => {
	const suffixes = Array.from({ length: 10 }, (_) =>
		Math.random().toString(36).substring(2)
	);
	await Promise.all(
		suffixes.map(async (suffix) => {
			const handlers = await t.context.instance.deploy(suffix);
			const testdb = handlers.get("testdb") as DatabaseHandler;
			const pickwick = await testdb.get("pickwick-papers");
			t.is(pickwick["_id"], "pickwick-papers");
		})
	);
});

test.after(async (t) => {
	await t.context.instance.stop();
});
