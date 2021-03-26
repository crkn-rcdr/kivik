import { JsonObject as JSONObject } from "type-fest";
import axios from "axios";
import { readJSON } from "fs-extra";
import yargs from "yargs";
import { Context } from "../context";
import { CommonArgv } from "./parse";

const fetchDocument = async (input: string): Promise<JSONObject> => {
	if (input.startsWith("https://") || input.startsWith("http://")) {
		return (await axios.get<JSONObject>(input)).data;
	} else {
		const json = await readJSON(input);
		if (typeof json !== "object")
			throw new TypeError(`${input} should be a JSON object`);
		return json as JSONObject;
	}
};

type ValidateArgv = CommonArgv & {
	database?: string;
	document?: string;
};

export default (context: Context) => {
	return {
		command: "validate <database> <document>",
		describe: "Validates a document against a database's validate function",
		builder: (yargs: yargs.Argv<CommonArgv>) =>
			yargs
				.positional("database", {
					type: "string",
					describe:
						"The database against whose schema the document will be validated.",
				})
				.positional("document", {
					type: "string",
					describe:
						"The document to validate. Can be specified as either a local file or a URL.",
				}),
		handler: async (argv: ValidateArgv) => {
			context.createLogger(argv);
			try {
				const document = await fetchDocument(argv.document as string);
				context.log("info", `${argv.document} parsed`);
				document;
				process.exit(0);
			} catch (error) {
				context.log("error", error.message);
				process.exit(1);
			}
		},
	};
};
