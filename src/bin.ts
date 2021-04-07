#!/usr/bin/env node

import { createContext } from "./context";
import { parse } from "./cli";
export { CommonArgv } from "./cli";

try {
	parse(process.argv.slice(2), createContext(process.cwd()));
} catch (error) {
	console.error(error.message);
}
