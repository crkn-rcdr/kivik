const getPort = require("get-port");
const Kivik = require("./Kivik");
const Container = require("./Container");
const { withDefaults } = require("./options");

const defaulted = withDefaults([
  "image",
  "port",
  "user",
  "password",
  "directory",
  "include",
  "exclude",
]);

const get = async (directory, port = undefined, options = {}) => {
  options = defaulted(options);
  options.deployFixtures = true;

  const kivik = await Kivik.fromDirectory(directory, options);

  const cPort = await getPort(port ? { port } : {});
  const container = await Container.get(cPort, options);

  return new Instance(kivik, container);
};

class Instance {
  constructor(kivik, container) {
    this.kivik = kivik;
    this.container = container;
    this.nano = undefined;
  }

  async start() {
    this.nano = await this.container.start();
  }

  async stop() {
    await this.container.stop();
  }

  async deploy() {
    if (this.nano) {
      await this.kivik.deploy(this.nano);
    } else {
      throw new Error("Start the instance before deploying it.");
    }
  }

  async destroy() {
    if (this.nano) {
      await this.kivik.destroy(this.nano);
    } else {
      throw new Error("Start the instance before deploying it.");
    }
  }
}

module.exports = { default: Instance, get };
