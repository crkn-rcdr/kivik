#!/usr/bin/env node

import { createContext } from "../context";
import { parse } from "./parse";
export { CommonArgv } from "./parse";

try {
	parse(process.argv.slice(2), createContext(process.cwd()));
} catch (error) {
	console.error(error.message);
}
