#!/usr/bin/env node

const deploy = require("./cli/deploy");
const inspect = require("./cli/inspect");
const validate = require("./cli/validate");

require("yargs").command([deploy, inspect, validate]).help().argv;
