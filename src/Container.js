const Docker = require("dockerode");
const fetch = require("node-fetch");
const util = require("util");
const setTimeoutPromise = util.promisify(setTimeout);
const Logger = require("./Logger");
const { authedNano } = require("./util");

const logger = Logger.get();
const TIMEOUT_START = 10;

const keys = ["image", "user", "password"];
const defaulted = require("./options").withDefaults(keys);

const get = async (port, options = {}) => {
  const { image, user = "kivikadmin", password = "kivikadmin" } = defaulted(
    options
  );

  const docker = new Docker();

  const dc = await docker.createContainer({
    Image: image,
    ExposedPorts: { "5984/tcp": {} },
    Env: [`COUCHDB_USER=${user}`, `COUCHDB_PASSWORD=${password}`],
    HostConfig: {
      PortBindings: {
        "5984/tcp": [{ HostPort: port.toString() }],
      },
    },
    Tty: true,
  });

  return new Container(dc, port, { user, password });
};

class Container {
  constructor(dc, port, options) {
    options = defaulted(options);
    this.dockerInterface = dc;
    this.port = port;
    this._nano = authedNano(port, options.user, options.password);

    this.dockerInterface.inspect().then((response) => {
      this.name = response.Name.substring(1);
    });
  }

  // returns a nano instance pointing to the container
  async start() {
    await this.dockerInterface.start();

    this.dockerInterface.attach(
      { stream: true, stdout: true, stderr: true },
      (_, stream) => {
        stream.on("data", (chunk) => {
          logger.couch(chunk.toString().trim());
        });
        stream.on("error", (error) => logger.error(error));
        stream.on("end", () =>
          logger.info(`No longer attached to container ${this.name}.`)
        );
      }
    );

    let timeout = TIMEOUT_START;
    const check = async () => {
      let ready = false;
      try {
        await fetch(`http://localhost:${this.port}/`);
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

    const createDb = async (db) => {
      return this._nano.relax({ path: db, method: "put", qs: { n: 1 } });
    };
    await createDb("_users");
    await createDb("_replicator");
    await createDb("_global_changes");

    logger.log({
      level: "info",
      message: `Container ${this.name} started. View at http://localhost:${this.port}/_utils`,
    });

    return this._nano;
  }

  async stop() {
    const running = (await this.dockerInterface.inspect()).State.Status;
    if (running) {
      await this.dockerInterface.stop();
      await this.dockerInterface.remove();
      logger.log({
        level: "info",
        message: `Container ${this.name} stopped and removed.`,
      });
    } else {
      throw new Error(
        "Attempting to stop a Kivik Container that is not started."
      );
    }
  }
}

module.exports = { default: Container, get };
