#!/usr/bin/env node
const getParser = require("./cli/parser");
const { hideBin } = require("yargs/helpers");
const Logger = require("./Logger");
const commands = require("./cli/commands");

const argv = getParser().parse(hideBin(process.argv));

argv.cli = true;
Logger.provideOptions(argv);
commands[argv._[0]](argv);
