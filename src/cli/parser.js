const fs = require("fs-extra");
const path = require("path");
const YAML = require("yaml");
const findUp = require("find-up");
const options = require("../options");

const getContext = (wd) => {
  const confPath = findUp.sync(
    ["kivikrc.json", "kivikrc.yml", "kivikrc.yaml"],
    { cwd: wd }
  );
  if (confPath) {
    const conf = YAML.parse(fs.readFileSync(confPath, { encoding: "utf-8" }));
    return {
      configFromFile: conf,
      directory: path.dirname(confPath),
    };
  } else {
    return { cli: true, directory: wd };
  }
};

const applyConfig = (argv) => {
  const conf = argv.configFromFile;
  const key = argv.config;

  if (conf) {
    const innerConfigs = conf.configs || {};
    if (key && !(key in innerConfigs))
      throw new Error(`configs.${key} is unspecified in your kivikrc file.`);

    const innerConf = key ? innerConfigs[key] : {};
    argv = Object.assign({}, conf, innerConf, argv);
  }

  delete argv.configFromFile;
  delete argv.configs;
  return argv;
};

module.exports = (wd = process.cwd()) =>
  require("yargs/yargs")()
    .scriptName("kivik")
    .option(
      options.slice([
        "config",
        "directory",
        "exclude",
        "excludeDesign",
        "include",
        "logLevel",
        "verbose",
      ])
    )
    .config(getContext(wd))
    .middleware([applyConfig], true)
    .command(
      "deploy",
      "Deploys design documents to a remote database",
      options.slice(["deployFixtures", "suffix", "password", "url", "user"])
    )
    .command(
      "inspect",
      "Spins up a CouchDB container for inspection",
      options.slice(["port", "image", "user", "password"])
    )
    .command(
      "validate <database> <document>",
      "Validates a document against a database's JSON Schema",
      (yargs) => {
        return yargs
          .positional("database", {
            type: "string",
            describe:
              "The database against whose schema the document will be validated.",
          })
          .positional("document", {
            type: "string",
            describe:
              "The document to validate. Can be specified as either a local file or a URL.",
          });
      }
    )
    .demandCommand(1, "Please specify a command: deploy, inspect, validate.")
    .help();
