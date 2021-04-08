import { sep as pathSeparator } from "path";
import axios from "axios";
import { readJson } from "fs-extra";
import yargs from "yargs";
import { MaybeDocument } from "nano";

import { UnloggedContext } from "../context";
import { createKivik, Database } from "../kivik";
import { CommonArgv } from ".";

const fetchDocument = async (input: string): Promise<MaybeDocument> => {
	if (input.startsWith("https://") || input.startsWith("http://")) {
		return (await axios.get<MaybeDocument>(input)).data;
	} else {
		const json = await readJson(input);
		if (typeof json !== "object")
			throw new TypeError(`${input} should be a JSON object`);
		return json;
	}
};

type ValidateArgv = CommonArgv & {
	database?: string;
	document?: string;
};

export default (unloggedContext: UnloggedContext) => {
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
			const context = unloggedContext.withArgv(argv);

			try {
				const kivik = await createKivik(context, "validate");
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
					context.log("success", `${argv.document} is valid.`);
					process.exit(0);
				} else {
					context.log(
						"error",
						`${argv.document} is invalid. Errors: ${response.errors}`
					);
					process.exitCode = 1;
				}
			} catch (error) {
				context.log("error", error.message);
				process.exitCode = 1;
			}
		},
	};
};
