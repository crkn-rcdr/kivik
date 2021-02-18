const Nano = require("nano");
const Logger = require("./Logger");

const logger = Logger.get();

const authedNano = (urlOrPort, user = undefined, pass = undefined) => {
  const url = Number.isInteger(urlOrPort)
    ? `http://localhost:${urlOrPort}/`
    : urlOrPort;

  try {
    const nanoOptions = { url: new URL(url) };

    if (user) {
      nanoOptions.requestDefaults = {
        auth: { username: user, password: pass },
      };
    }

    return Nano(nanoOptions);
  } catch (error) {
    if (error.code === "ERR_INVALID_URL") {
      logger.error(`${url} is an invalid URL.`);
    } else {
      throw error;
    }
  }

  return null;
};

module.exports = { authedNano };
