#!/usr/bin/env node

const cli = require("./src/cli");
const { hideBin } = require("yargs/helpers");

cli.parser(cli.context()).parse(hideBin(process.argv));
