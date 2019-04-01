const Docker = require("dockerode");
const util = require("util");

const TIMEOUT_START = 10;

module.exports = exports = function Container({
  couchImage: couchImage,
  hostPort: hostPort
}) {
  let dockerOptions = {
    Image: couchImage,
    ExposedPorts: { "5984/tcp": {} },
    HostConfig: {
      PortBindings: {
        "5984/tcp": [{ HostPort: hostPort.toString() }]
      }
    },
    Tty: true
  };

  let address = `http://localhost:${hostPort}/`;

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
        console.log(`Container ${name} stopped and removed.`);
      };

      await container.start();
      const name = (await container.inspect()).Name.substring(1);
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
      console.log("Could not run CouchDB container:");
      console.log(error);
      process.exit(1);
    }
  };

  // placeholder for the closure in which this.kill stops and removes the container
  this.kill = async () => {};

  this.hostURL = () => {
    return address;
  };
};
