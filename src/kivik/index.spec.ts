import anyTest, { TestInterface } from "ava";
import Docker from "dockerode";
import getPort from "get-port";
import { localhost as localNano } from "@crkn-rcdr/nano";

import { createKivik, DatabaseHandler, Kivik } from ".";

interface LocalContext {
	kivik: Kivik;
	container: Docker.Container;
	testDeploy: <D>(db: string, suffix?: string) => Promise<DatabaseHandler<D>>;
}

const test = anyTest as TestInterface<LocalContext>;

export const createContainer = async (kivik: Kivik) => {
	const port = await getPort();

	const docker = new Docker();

	const dc = await docker.createContainer({
		Image: "couchdb:3.1",
		ExposedPorts: { "5984/tcp": {} },
		Env: [`COUCHDB_USER=admin`, `COUCHDB_PASSWORD=admin`],
		HostConfig: {
			PortBindings: {
				"5984/tcp": [{ HostPort: port.toString() }],
			},
		},
		Tty: true,
	});

	// Initialize Couch
	await dc.start();

	const nano = localNano(port, { user: "admin", password: "admin" });

	// Deploy everything if only to create the system dbs
	await kivik.deploy({
		nano,
		dbs: null,
		fixtures: true,
	});

	return { container: dc, nano };
};

test.before(async (t) => {
	const kivik = await createKivik(".", "instance");
	const { container, nano } = await createContainer(kivik);
	t.context = {
		kivik,
		container,
		testDeploy: kivik.testDeployer(nano),
	};
});

test.serial("Can survive multiple deploys", async (t) => {
	const suffixes = Array.from({ length: 10 }, (_) =>
		Math.random().toString(36).substring(2)
	);
	await Promise.all(
		suffixes.map(async (suffix) => {
			const testdb = await t.context.testDeploy("testdb", suffix);
			const pickwick = await testdb.get("pickwick-papers");
			t.is(pickwick["_id"], "pickwick-papers");
		})
	);
});

test.serial("Can get the results of a deploy", async (t) => {
	const testdb = await t.context.testDeploy("testdb");
	const pickwick = await testdb.get("pickwick-papers");
	t.is(pickwick["_id"], "pickwick-papers");
});

test.after(async (t) => {
	await t.context.kivik.close();
	await t.context.container.stop();
	await t.context.container.remove();
});
