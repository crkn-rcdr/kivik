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

test("Instances can be hooked into", async (t) => {
	const instance = t.context.instance;
	const handlers = await instance.deploy();
	const testdb = handlers.get("testdb") as DatabaseHandler;
	const pickwick = await testdb.get("pickwick-papers");
	t.is(pickwick["_id"], "pickwick-papers");
});

test.after(async (t) => {
	t.context.instance.stop();
});
