#!/usr/bin/env node

import { parse } from "./parse";
import { init as initContext } from "../context";

try {
	parse(process.argv.slice(2), initContext(process.cwd()));
} catch (error) {
	console.error(error.message);
}
