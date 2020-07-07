const Docker = require("dockerode");
const util = require("util");

const TIMEOUT_START = 10;

module.exports = function Container(options) {
  options = Object.assign(
    {},
    { image: "couchdb:1.7", port: 5984, quiet: false },
    options || {}
  );

  let dockerOptions = {
    Image: options.image,
    ExposedPorts: { "5984/tcp": {} },
    HostConfig: {
      PortBindings: {
        "5984/tcp": [{ HostPort: options.port.toString() }],
      },
    },
    Tty: true,
  };

  let address = `http://localhost:${options.port}/`;

  // Ensures that the couch container is accepting requests
  let _ensureReady = async () => {
    const nano = require("nano")(address);
    let timeout = TIMEOUT_START;
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
      await util.promisify(setTimeout)(timeout);
      timeout *= 2;
    }

    return;
  };

  let docker = new Docker();

  this.run = async (output = false) => {
    try {
      const container = await docker.createContainer(dockerOptions);

      this.kill = async () => {
        await container.stop();
        await container.remove();
        if (!options.quiet)
          console.log(`Container ${name} stopped and removed.`);
      };

      await container.start();
      const name = (await container.inspect()).Name.substring(1);
      if (!options.quiet)
        console.log(`Container ${name} started. View at ${address}_utils`);

      process.on("SIGINT", this.kill);

      container.attach(
        { stream: true, stdout: true, stderr: true },
        (err, stream) => {
          if (output) {
            stream.pipe(process.stdout);
          }
        }
      );

      await _ensureReady();
    } catch (error) {
      console.error(`Could not run CouchDB container: ${error.message}`);
      process.exit(1);
    }
  };

  // placeholder for the closure in which this.kill stops and removes the container
  this.kill = async () => {};

  this.hostURL = () => {
    return address;
  };
};
