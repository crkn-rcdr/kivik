const path = require("path");
const Container = require("./Container");
const DatabaseSet = require("./DatabaseSet");

module.exports = function KivikInstance(directory, options) {
  options = Object.assign(
    {},
    {
      image: "couchdb:1.7",
      port: 5984,
      couchOutput: false,
      dbSubset: [],
      insertInvalidFixtures: false,
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
    insertInvalidFixtures: options.insertInvalidFixtures,
    quiet: options.quiet,
  });

  this.run = async () => {
    try {
      await Promise.all([this.databaseSet.load(), this.container.run()]);
      await this.databaseSet.process(this.container.hostURL());
    } catch (error) {
      console.error(`Error running a kivik instance: ${e.message}`);
      await container.kill();
    }
  };

  this.kill = async () => {
    this.container.kill();
  };
};
