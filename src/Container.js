const Docker = require("dockerode");
const util = require("util");

module.exports = exports = function Container({
  couchImage: couchImage,
  hostPort: hostPort
}) {
  this.options = {
    Image: couchImage,
    ExposedPorts: { "5984/tcp": {} },
    HostConfig: {
      PortBindings: {
        "5984/tcp": [{ HostPort: hostPort.toString() }]
      }
    },
    Tty: true
  };

  this.address = `http://localhost:${hostPort}/`;

  this.docker = new Docker();

  this.run = async (output = false) => {
    try {
      const container = await this.docker.createContainer(this.options);

      await container.start();
      const name = (await container.inspect()).Name.substring(1);
      console.log(`Container ${name} started. View at ${this.address}_utils`);

      process.on("SIGINT", async () => {
        await container.stop();
        await container.remove();
        console.log(`Container ${name} stopped and removed.`);
      });

      container.attach(
        { stream: true, stdout: true, stderr: true },
        (err, stream) => {
          if (output) {
            stream.pipe(process.stdout);
          }
        }
      );

      await this.ensureReady();
    } catch (error) {
      console.log("Could not run CouchDB container:");
      console.log(error);
      process.exit(1);
    }
  };

  this.ensureReady = async () => {
    const nano = require("nano")(this.address);
    const check = async () => {
      let ready = false;
      try {
        await nano.db.list();
        ready = true;
      } catch (ignore) {}

      return ready;
    };

    while (true) {
      if (await check()) {
        break;
      }
      await util.promisify(setTimeout)(500);
    }

    return;
  };
};
