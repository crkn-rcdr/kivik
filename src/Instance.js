const path = require("path");
const Container = require("./Container");
const Kivik = require("./Kivik");

const keys = ["image", "directory", "include", "exclude", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function KivikInstance(options = {}) {
  options = withDefaults(options);

  options.context = "inspect";
  options.deployFixtures = true;
  options.createDatabases = true;

  const container = new Container(options);

  this.kivik = new Kivik(options);

  this.start = async () => {
    let nanoInstance;
    try {
      nanoInstance = await container.start();
    } catch (error) {
      console.error(`Error running the Kivik instance: ${e.message}`);
      await container.stop();
      return;
    }

    await this.kivik.load();
    await this.kivik.deploy(nanoInstance);

    return nanoInstance;
  };

  this.stop = async () => {
    await container.stop();
  };
};
