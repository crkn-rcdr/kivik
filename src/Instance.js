const path = require("path");
const getPort = require("get-port");
const Container = require("./Container");
const Kivik = require("./Kivik");

const keys = ["image", "port", "directory", "include", "exclude", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function KivikInstance(options = {}) {
  options = withDefaults(options);

  options.context = "inspect";
  options.deployFixtures = true;
  options.createDatabases = true;

  this.kivik = new Kivik(options);

  this.port = null;
  this.stop = async () => {};

  this.start = async () => {
    const gpo = options.port ? { port: options.port } : {};
    this.port = await getPort(gpo);
    if (options.port && options.port !== this.port) {
      console.warn(
        `Port ${options.port} is unavailable. The CouchDB instance will be reachable at http://localhost:${this.port}/`
      );
    }

    const container = new Container(this.port, options);

    let nanoInstance;
    try {
      nanoInstance = await container.start();
    } catch (error) {
      console.error(`Error running the Kivik instance: ${e.message}`);
      await container.stop();
      return;
    }

    this.stop = async () => {
      await container.stop();
    };

    await this.kivik.load();
    await this.kivik.deploy(nanoInstance);

    return nanoInstance;
  };
};
