const Docker = require("dockerode");
const Nano = require("nano");
const fetch = require("node-fetch");
const util = require("util");
const st = util.promisify(setTimeout);

const TIMEOUT_START = 10;

const keys = ["image", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function Container(options = {}) {
  const { image, verbose } = withDefaults(options);
  const port = 22222; // TODO: get-port

  const docker = new Docker();

  // Ensures that the couch container is accepting requests
  const _ensureReady = async (port) => {
    let timeout = TIMEOUT_START;
    const check = async () => {
      let ready = false;
      try {
        await fetch(`http://localhost:${port}/`);
        ready = true;
      } catch (ignore) {}

      return ready;
    };

    while (true) {
      if (await check()) {
        break;
      }
      await st(timeout);
      timeout *= 2;
    }

    return;
  };

  // placeholder for the closure in which this.kill stops and removes the container
  this.stop = async () => {};

  // returns a nano instance pointing to the container
  this.start = async () => {
    const dockerOptions = {
      Image: image,
      ExposedPorts: { "5984/tcp": {} },
      HostConfig: {
        Binds: [`${__dirname}/container.ini:/opt/couchdb/etc/local.ini`],
        PortBindings: {
          "5984/tcp": [{ HostPort: port.toString() }],
        },
      },
      Tty: true,
    };

    let container;
    try {
      container = await docker.createContainer(dockerOptions);
    } catch (error) {
      console.error(`Could not create CouchDB container: ${error.message}`);
      process.exit(1);
    }

    try {
      await container.start();
    } catch (error) {
      console.error(`Could not start CouchDB container: ${error.message}`);
      process.exit(1);
    }

    const name = (await container.inspect()).Name.substring(1);

    if (verbose > 0) {
      console.log(
        `Container ${name} started. View at http://localhost:${port}/_utils`
      );
    }

    this.stop = async () => {
      await container.stop();
      await container.remove();
      if (verbose > 0) console.log(`Container ${name} stopped and removed.`);
    };

    process.on("SIGINT", this.stop);

    container.attach(
      { stream: true, stdout: true, stderr: true },
      (_, stream) => {
        if (verbose > 1) {
          stream.pipe(process.stdout);
        }
      }
    );

    await _ensureReady(port);

    return Nano({
      url: `http://localhost:${port}`,
      requestDefaults: {
        auth: {
          username: "kivikadmin",
          password: "kivikpassword",
        },
      },
    });
  };
};
