import { sep as pathSeparator } from "path";
import axios from "axios";
import { readJSON } from "fs-extra";
import yargs from "yargs";
import { InitContext } from "../context";
import { CommonArgv } from "./parse";
import { init as createKivik } from "../kivik";
import { Database } from "../kivik/database";
import { MaybeDocument } from "nano";

const fetchDocument = async (input: string): Promise<MaybeDocument> => {
	if (input.startsWith("https://") || input.startsWith("http://")) {
		return (await axios.get<MaybeDocument>(input)).data;
	} else {
		const json = await readJSON(input);
		if (typeof json !== "object")
			throw new TypeError(`${input} should be a JSON object`);
		return json;
	}
};

type ValidateArgv = CommonArgv & {
	database?: string;
	document?: string;
};

export default (context: InitContext) => {
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
			const fullContext = context.withArgv(argv);

			try {
				const kivik = await createKivik(fullContext, "validate");
				const dbName = argv.database as string;
				if (!kivik.databases.has(dbName))
					throw new Error(`Cannot find database directory ${dbName}`);
				const db = kivik.databases.get(dbName) as Database;
				if (!db.canValidate())
					throw new Error(
						`Database ${dbName} has no validate function at ${dbName}${pathSeparator}validate.js.`
					);

				const document = await fetchDocument(argv.document as string);
				const response = db.validate(document);
				if (response.valid) {
					fullContext.log("success", `${argv.document} is valid.`);
					process.exit(0);
				} else {
					fullContext.log(
						"error",
						`${argv.document} is invalid. Errors: ${response.errors}`
					);
					process.exit(1);
				}
			} catch (error) {
				fullContext.log("error", error.message);
				process.exit(1);
			}
		},
	};
};
