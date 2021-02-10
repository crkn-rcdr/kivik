#!/usr/bin/env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const deploy = require("./cli/deploy");
const inspect = require("./cli/inspect");
const validate = require("./cli/validate");

const keys = ["directory", "include", "exclude", "verbose"];
const options = require("./options").slice(keys);

const parser = yargs(hideBin(process.argv))
  .scriptName("kivik")
  .config("config", "JSON file containing configuration options.")
  .option(options)
  .command([deploy, inspect, validate])
  .demandCommand(1, "Please specify a command: deploy, inspect, validate.")
  .help();

parser.parse();

module.exports = parser;
