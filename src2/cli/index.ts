#!/usr/bin/env node

import { parse } from "./parse";
import { Context } from "../context";

try {
	parse(process.argv.slice(2), new Context(process.cwd()));
} catch (error) {
	console.error(error.message);
}
