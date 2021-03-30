import test from "ava";

import { fromDirectory } from ".";
import { directory } from "../example";

test("the junk above runs", async (t) => {
	const instance = await fromDirectory(directory);
	await instance.deploy();
	await instance.stop();
	t.pass();
});
