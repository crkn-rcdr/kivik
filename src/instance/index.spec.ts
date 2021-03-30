import anyTest, { TestInterface } from "ava";

import { fromDirectory, Instance } from ".";
import { directory } from "../example";
import { Handler } from "../kivik/database";

interface LocalContext {
	instance: Instance;
}

const test = anyTest as TestInterface<LocalContext>;

test.before(async (t) => {
	t.context = { instance: await fromDirectory(directory) };
});

test("Instances can be hooked into", async (t) => {
	const instance = t.context.instance;
	const handlers = await instance.deploy();
	const testdb = handlers["testdb"] as Handler;
	const pickwick = await testdb.get("pickwick-papers");
	t.is(pickwick["_id"], "pickwick-papers");
});

test.after(async (t) => {
	t.context.instance.stop();
});
