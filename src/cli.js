const fs = require("fs-extra");
const path = require("path");

const YAML = require("yaml");
const findUp = require("find-up");

const context = (wd) => {
  const confPath = findUp.sync(
    ["kivikrc.json", "kivikrc.yml", "kivikrc.yaml"],
    { cwd: wd || process.cwd() }
  );
  if (confPath) {
    const conf = YAML.parse(fs.readFileSync(confPath, { encoding: "utf-8" }));
    return { configFromFile: conf, directory: path.dirname(confPath) };
  } else {
    return { directory: process.cwd() };
  }
};

const applyConfig = (argv) => {
  const conf = argv.configFromFile;
  const innerConfigs = conf.configs || {};
  const key = argv.config;

  if (conf) {
    if (key && !(key in innerConfigs))
      throw new Error(`configs.${key} is unspecified in your kivikrc file.`);

    const innerConf = key ? innerConfigs[key] : {};
    argv = Object.assign({}, conf, innerConf, argv);
  }

  delete argv.configFromFile;
  delete argv.configs;
  delete argv.config;
  return argv;
};

const setContextArg = (argv) => {
  const c = argv._[0];
  if (c) argv.context = c;
  return argv;
};

const keys = ["config", "directory", "include", "exclude", "verbose"];
const options = require("./options").slice(keys);

const commands = [
  require("./cli/deploy"),
  require("./cli/inspect"),
  require("./cli/validate"),
];

const parser = (config) =>
  require("yargs/yargs")()
    .scriptName("kivik")
    .option(options)
    .config(config)
    .middleware([setContextArg, applyConfig], true)
    .command(commands)
    .demandCommand(1, "Please specify a command: deploy, inspect, validate.")
    .help();

module.exports = { parser, context };
