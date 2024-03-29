# Kivik

An opinionated library and command-line utility for configuration CouchDB endpoints, databases, and design documents.

Kivik uses [Nano](https://github.com/apache/couchdb-nano) to connect to CouchDB.

This package has nothing to do with [the Go kivik CouchDB library](https://github.com/go-kivik/kivik). I just also happen to own a [Kivik couch](https://www.ikea.com/ca/en/cat/kivik-series-18329/).

## Directory structure

Kivik's opinionated nature lies in its expectation of a directory structure where it will find all of the CouchDB configuration you'd like to test and deploy. This repository contains an [example directory structure](example) which contains all possible kinds of configuration, as explained below:

- `./kivirc.(json|yaml|yml)`: The Kivik [RC File](#RC-File).
- `./$DB/`: Subdirectories (that haven't been [excluded](#options)) are treated as CouchDB databases with the name `$DB`.
  - `./$DB/validate.js`: A module that returns a function that [validates data against the database](#Validate).
  - `./$DB/fixtures/*.json`: Test fixtures for ths database. Not deployed by default, but can be configured to do so for testing.
  - `./$DB/indexes/*.json`: Query indexes for use by the [Mango JSON query server](https://docs.couchdb.org/en/stable/api/database/find.html#db-index)
  - `./$DB/design/$DDOC/`: [Design document](https://docs.couchdb.org/en/stable/ddocs/ddocs.html) configuration. The design document specified in this directory will be deployed to CouchDB with the id `_design/$DDOC`. See the [`test` design document](example/testdb/design/test) for a demonstration of how a design document is laid out.

## Configuration

### RC File

Configuration options can be specified in an RC file, found at `./kivikrc.json`, `./kivikrc.yml`, or `./kivikrc.yaml`. The shape of a Kivik RC file is defined in [`src/context/rc.ts`](src/context/rc.ts), and I've pasted the relevant parts below. An example of sorts can be found at [`kivikrc.json`](kivikrc.json). At this moment, deploying Kivik configuration to an external CouchDB endpoint requires adding at least one object to the `deployments` RC file property.

**NEW** Use the `subdirectory` option to specify which subdirectory of the directory containing the Kivik RC file contains the database configuration. This is really handy when testing monorepos.

The RC file is read whether using Kivik on the command line or programmatically.

```ts
/** Kivik RC file configuration. */
export interface Rc {
  /**
   * Object containing deployment configurations. Adding at least one is
   * required to be able to deploy Kivik configuration elsewhere.
   */
  deployments?: Record<string, Deployment>;
  /** Subdirectories of the root directory which do not contain database configuration. Default: `["node_modules"]` */
  excludeDirectories?: string[];
  /** JavaScript files to ignore when processing design documents. Default: `["*.spec.*", "*.test.*"]` */
  excludeDesign?: string[];
  /** Subdirectory of the directory containing the RC file where the database configuration can be found. */
  subdirectory?: string;
}

/**
 * Configuration for deploying design documents to a CouchDB endpoint.
 */
export interface Deployment {
  /** CouchDB endpoint URL. Required. */
  url: string;
  /**
   * Authentication credentials. If left unset, Kivik will attempt to deploy
   * anonymously.
   */
  auth?: {
    /** CouchDB username */
    user: string;
    /** `user`'s password */
    password: string;
  };
  /** Suffix to append to the end of each database name. Default: `undefined` */
  suffix?: string;
  /** Whether or not to deploy fixtures along with the design documents. */
  fixtures?: boolean;
  /** List of databases to deploy. By default, all databases are deployed. */
  dbs?: string[];
}
```

### Command-line options

- `--color`: Colorize output. Use `--no-color` (or set the `NO_COLOR` environment variable) to skip colorization. Default: `true`.
- `--logLevel`: Log level for the standard log output. Your options are:
  - `error`: When things don't work as expected
  - `success`: When things do work as expected
  - `warn`: Something interesting is about to happen, or something didn't work as expected but it isn't a big deal
  - `info`: Everything Kivik is doing
  - `couch`: For `kivik dev`, output the CouchDB logs
- `--logTimestamp`: Add a timestamp to log output.
- `--quiet`: Silence output.

## Operations

### Validate

```shell
$ kivik validate db path/to/file.json
$ kivik validate db https://example.com/file.json
```

```ts
import { createKivik, Database } from "kivik";

const database = "db";
const document = {
  _id: "something",
};

const kivik = await createKivik("path/to/directory", "validate");
const kivikdb = kivik.databases.get(database) as Database;

const response = kivikdb.validate(document);

if (response.valid) {
  console.log("yay!");
}

await kivik.close();
```

Validates a file against a database's validation function that you provide.

To provide a validation function, have `$DB/validate.js` export it. The function's return value must be shaped like this:

```ts
export type ValidateResponse =
  | boolean
  | {
      /** Is the document valid? */
      valid: boolean;
      /** Validation errors. */
      errors?: any;
    };
```

(`errors` is passed through `JSON.stringify` in log output.)

When a database has a validation function, its fixtures will be validated against it. Invalid fixtures will not be deployed. If a database does not have a validation function, all fixtures are considered valid and will be deployed. If you try to validate a document against a database on the command line, you'll get an error.

The example directory contains a validation function that uses [Ajv](https://ajv.js.org) to validate data against a JSON Schema.

### Fixtures

```shell
$ kivik fixtures
```

```ts
import { createKivik } from "kivik";

const kivik = await createKivik("path/to/dir", "fixtures");
const errors = kivik.validateFixtures();
```

Returns a report of fixtures that do not validate against their database's validate function.

### Deploy

Deploys Kivik configuration to a CouchDB endpoint. If, in your RC file, you have the following:

```json
{
  "deployments": {
    "production": {
      "url": "http://production:5984/",
      "auth": {
        "user": "admin",
        "password": "donttellanyone"
      }
    }
  }
}
```

you can deploy Kivik configuration to the production server like so:

```shell
$ kivik deploy production
```

```ts
import { createKivik } from "kivik";

const kivik = await createKivik("path/to/dir", "deploy");
await kivik.deploy("production");
await kivik.close();
```

## Using Kivik for development and testing

### Watch mode

Run `kivik deploy` with the `--watch` flag to deploy subsequent changes you make to your Kivik files.

### Testing your design

```ts
import { localhost as localNano } from "@crkn-rcdr/nano";
import { createKivik } from "kivik";

const client = localNano(5984, { user: "admin", password: "admin" });
const kivik = await createKivik("kivikrc/directory");
const testDeploy = kivik.testDeployer(client);

// handler is a couchdb-nano `DocumentScope` object
// supplying a suffix allows you to deploy multiple tests at once without conflict
const handler = await testDeploy("db-name", "unique-testing-suffix");
```

## Testing Kivik

```shell
$ git clone https://github.com/crkn-rcdr/kivik
$ cd kivik
$ docker pull couchdb:3.1
$ pnpm install
$ pnpm test
```

## Bugs, feature requests, etc.

[Find or submit an issue on GitHub.](https://github.com/crkn-rcdr/kivik/issues)
