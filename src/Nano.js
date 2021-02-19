const getNano = require("nano");
const Logger = require("./Logger");

const logger = Logger.get();

const get = (url, options) => {
  const { user, password } = options;

  try {
    const nanoOptions = { url: new URL(url) };

    if (user) {
      nanoOptions.requestDefaults = {
        auth: { username: user, password },
      };
    }

    return getNano(nanoOptions);
  } catch (error) {
    if (error.code === "ERR_INVALID_URL") {
      logger.error(`${url} is an invalid URL.`);
    } else {
      throw error;
    }
  }

  return null;
};

const localhost = (port, options) => {
  return get(`https://localhost:${port}`, options);
};

module.exports = { get, localhost };
