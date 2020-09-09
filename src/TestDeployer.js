const Deployer = require("./Deployer");

module.exports = function KivikTestDeployer(directory, server, dbSubset) {
  Object.assign(
    this,
    new Deployer(directory, server, {
      dbSubset: dbSubset || [],
      fixtures: true,
      createDatabases: true,
      quiet: true,
      test: true,
    })
  );
};
