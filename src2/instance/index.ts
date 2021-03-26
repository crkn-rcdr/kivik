import { ServerScope } from "nano";
import { Context } from "../context";
import { get as getKivik, Kivik } from "../kivik";
import { Container, get as getContainer } from "./container";

export const get = async (context: Context) => {
	const kivik = await getKivik(context);
	const container = await getContainer(context);
	const nano = await container.start();

	return new Instance(kivik, container, nano);
};

export class Instance {
	private readonly kivik: Kivik;
	private readonly container: Container;
	// private readonly nano: ServerScope;

	constructor(kivik: Kivik, container: Container, _nano: ServerScope) {
		this.kivik = kivik;
		this.container = container;
		// this.nano = nano;
	}

	async stop() {
		await this.kivik.close();
		await this.container.stop();
	}
}
