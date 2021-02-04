const Deployer = require("./Deployer");

module.exports = function KivikTestDeployer(directory, agent, dbSubset) {
  Object.assign(
    this,
    new Deployer(directory, agent, {
      dbSubset: dbSubset || [],
      fixtures: true,
      createDatabases: true,
      quiet: true,
      test: true,
    })
  );
};
