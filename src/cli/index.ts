#!/usr/bin/env node

import { init as initContext } from "../context";
import { parse } from "./parse";

try {
	parse(process.argv.slice(2), initContext(process.cwd()));
} catch (error) {
	console.error(error.message);
}
