#!/usr/bin/env node
const getParser = require("./cli/parser");
const { hideBin } = require("yargs/helpers");
const Logger = require("./Logger");
const { withDefaults } = require("./options");

const deploy = require("./cli/deploy");
const inspect = require("./cli/inspect");
const validate = require("./cli/validate");

const handlers = { deploy, inspect, validate };

const argv = getParser().parse(hideBin(process.argv));
const command = argv._[0];
const handler = handlers[command];

if (!handler) {
  Logger.get().error(
    `${command} is not a valid Kivik command. See 'kivik --help' for more information.`
  );
  process.exit(1);
}

const options = withDefaults()(argv);

options.cli = true;
Logger.provideOptions(options);

handler(options);
