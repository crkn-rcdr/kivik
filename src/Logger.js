const path = require("path");
const winston = require("winston");
const transports = winston.transports;
const format = winston.format;
const { withDefaults } = require("./options");

const levels = {
  error: 0,
  alert: 0,
  warn: 1,
  info: 2,
  couch: 3,
  debug: 4,
};

const colors = {
  error: "bold red",
  alert: "bold yellow",
  warn: "bold yellow",
  info: "bold green",
  couch: "bold grey",
  debug: "bold blue",
};

const levelFromNumber = (num) =>
  Object.keys(levels).find((key) => levels[key] === num) || "debug";

winston.addColors(colors);

const logger = winston.createLogger({
  levels,
  level: "error",
  handleExceptions: true,
  handleRejections: true,
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

let setup = false;

const defaulted = withDefaults(["directory", "logLevel", "verbose"]);

const provideOptions = (options = {}) => {
  if (!setup) {
    options = defaulted(options);

    logger.level = levelFromNumber(options.verbose);

    if (options.logLevel) {
      const logPath = path.resolve(path.join(options.directory, ".kivik.log"));
      logger.add(
        new transports.File({
          filename: logPath,
          level: logLevel,
          format: format.combine(format.timestamp(), format.json()),
        })
      );
    }

    setup = true;
  }

  return logger;
};

const get = () => {
  return logger;
};

module.exports = { provideOptions, get };
