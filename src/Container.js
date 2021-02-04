const Docker = require("dockerode");
const Nano = require("nano");
const fetch = require("node-fetch");
const util = require("util");
const st = util.promisify(setTimeout);

const TIMEOUT_START = 10;

module.exports = function Container(options) {
  options = Object.assign(
    {},
    {
      image: "couchdb:3.1",
      port: 5984,
      quiet: false,
      showOutput: false,
    },
    options || {}
  );

  let dockerOptions = {
    Image: options.image,
    ExposedPorts: { "5984/tcp": {} },
    HostConfig: {
      Binds: [`${__dirname}/container.ini:/opt/couchdb/etc/local.ini`],
      PortBindings: {
        "5984/tcp": [{ HostPort: options.port.toString() }],
      },
    },
    Tty: true,
  };

  this.agent = Nano({
    url: `http://localhost:${options.port}`,
    requestDefaults: {
      auth: {
        username: "kivikadmin",
        password: "kivikpassword",
      },
    },
  });

  // Ensures that the couch container is accepting requests
  let _ensureReady = async () => {
    let timeout = TIMEOUT_START;
    const check = async () => {
      let ready = false;
      try {
        await fetch(`http://localhost:${options.port}/`);
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

  let docker = new Docker();

  this.run = async () => {
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

    if (!options.quiet) {
      console.log(
        `Container ${name} started. View at http://localhost:${options.port}/_utils`
      );
    }

    this.kill = async () => {
      await container.stop();
      await container.remove();
      if (!options.quiet) console.log(`Container ${name} stopped and removed.`);
    };

    process.on("SIGINT", this.kill);

    container.attach(
      { stream: true, stdout: true, stderr: true },
      (err, stream) => {
        if (options.showOutput) {
          stream.pipe(process.stdout);
        }
      }
    );

    await _ensureReady();
  };

  // placeholder for the closure in which this.kill stops and removes the container
  this.kill = async () => {};
};
