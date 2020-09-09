const path = require("path");
const DatabaseSet = require("./DatabaseSet");

module.exports = function KivikDeployer(directory, server, options) {
  options = Object.assign(
    {},
    {
      dbSubset: [],
      fixtures: false,
      createDatabases: false,
      quiet: true,
      test: false,
    },
    options
  );

  this.databaseSet = new DatabaseSet(path.resolve(directory || "."), {
    subset: options.dbSubset,
    fixtures: options.fixtures,
    invalidFixtures: false,
    createDatabases: options.createDatabases,
    quiet: options.quiet,
    test: options.test,
  });

  this.load = async () => {
    await this.databaseSet.load();
  };

  this.deploy = async () => {
    await this.databaseSet.deploy(server);
  };

  this.reset = async () => {
    await this.databaseSet.reset(server);
  };
};
