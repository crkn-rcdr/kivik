const path = require("path");
const Container = require("./Container");
const DatabaseSet = require("./DatabaseSet");

module.exports = function KivikInstance(directory, options) {
  options = Object.assign(
    {},
    {
      image: "couchdb:3.1",
      port: 5984,
      couchOutput: false,
      dbSubset: [],
      invalidFixtures: false,
      quiet: true,
    },
    options
  );

  this.container = new Container({
    image: options.image,
    port: options.port,
    showOutput: options.couchOutput,
    quiet: options.quiet,
  });

  this.databaseSet = new DatabaseSet(path.resolve(directory || "."), {
    subset: options.dbSubset,
    fixtures: true,
    invalidFixtures: options.invalidFixtures,
    createDatabases: true,
    quiet: options.quiet,
  });

  this.run = async () => {
    try {
      await Promise.all([this.databaseSet.load(), this.container.run()]);
      await this.databaseSet.deploy(this.container.agent);
    } catch (error) {
      console.error(`Error running a kivik instance: ${e.message}`);
      await container.kill();
    }
  };

  this.kill = async () => {
    this.container.kill();
  };
};
