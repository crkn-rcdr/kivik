const Docker = require("dockerode");
const authedNano = require("./util").authedNano;
const fetch = require("node-fetch");
const util = require("util");
const setTimeoutPromise = util.promisify(setTimeout);

const TIMEOUT_START = 10;

const keys = ["image", "verbose"];
const withDefaults = require("./options").withDefaults(keys);

module.exports = function Container(port, options = {}) {
  const { image, verbose } = withDefaults(options);

  const docker = new Docker();

  // placeholder for the closure in which this.stop stops and removes the container
  this.stop = async () => {};

  // returns a nano instance pointing to the container
  this.start = async () => {
    const container = await docker.createContainer({
      Image: image,
      ExposedPorts: { "5984/tcp": {} },
      HostConfig: {
        Binds: [`${__dirname}/container.ini:/opt/couchdb/etc/local.ini`],
        PortBindings: {
          "5984/tcp": [{ HostPort: port.toString() }],
        },
      },
      Tty: true,
    });

    await container.start();

    const name = (await container.inspect()).Name.substring(1);

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
      await setTimeoutPromise(timeout);
      timeout *= 2;
    }

    if (verbose > 0) {
      console.log(
        `Container ${name} started. View at http://localhost:${port}/_utils`
      );
    }

    return authedNano(port, "kivikadmin", "kivikpassword");
  };
};
