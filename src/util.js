const Nano = require("nano");

const authedNano = (urlOrPort, user = undefined, pass = undefined) => {
  const url = Number.isInteger(urlOrPort)
    ? `http://localhost:${urlOrPort}/`
    : urlOrPort;

  const nanoOptions = { url };
  if (user) {
    nanoOptions.requestDefaults = {
      auth: { username: user, password: pass },
    };
  }

  return Nano(nanoOptions);
};

module.exports = { authedNano };
