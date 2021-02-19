const Instance = require("../Instance");

module.exports = async (argv) => {
  const instance = await Instance.get(argv.directory, argv.port, argv);

  const handle = () => {
    instance.stop();
  };

  process.on("SIGINT", handle);
  process.on("SIGTERM", handle);

  const nano = await instance.start();
  await instance.deploy(nano);
};
