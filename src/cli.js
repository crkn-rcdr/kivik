#!/usr/bin/env node

const deploy = require("./cli/deploy");
const inspect = require("./cli/inspect");
const validate = require("./cli/validate");

const keys = ["directory", "include", "exclude", "verbose"];
const options = require("./options").slice(keys);

const parser = require("yargs/yargs")(process.argv.slice(2))
  .scriptName("kivik")
  .config("config", "JSON file containing configuration options.")
  .option(options)
  .command([deploy, inspect, validate])
  .demandCommand()
  .help();

parser.parse();

module.exports = parser;
