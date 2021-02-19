# Kivik

An opinionated library and command-line utility for configuration CouchDB endpoints, databases, and design documents.

Kivik uses [Nano](https://github.com/apache/couchdb-nano) to connect to CouchDB.

This package has nothing to do with [the Go kivik CouchDB library](https://github.com/go-kivik/kivik). I just also happen to own a [Kivik couch](https://www.ikea.com/ca/en/cat/kivik-series-18329/).

## Directory structure

Kivik's opinionated nature lies in its expectation of a directory structure where it will find all of the CouchDB configuration you'd like to test and deploy. This repository contains an [example directory structure](example) which contains all possible kinds of configuration, as explained below:

- `./kivirc.(json|yaml|yml)`: The Kivik [RC File](#RC-File).
- `./schemas/*.json`: JSON Schema files loaded by the [validator](#Validate).
- `./$DB/`: Subdirectories (that haven't been [excluded](#options)) are treated as CouchDB databases with the name `$DB`.
  - `./$DB/schema.json`: The JSON Schema corresponding to this particular database, loaded by the [validator](#Validate).
  - `./$DB/fixtures/*.json`: Test fixtures for ths database. Not deployed by default, but can be configured to do so for testing.
  - `./$DB/indexes/*.json`: Query indexes for use by the [Mango JSON query server](https://docs.couchdb.org/en/stable/api/database/find.html#db-index)
  - `./$DB/design/$DDOC/`: [Design document](https://docs.couchdb.org/en/stable/ddocs/ddocs.html) configuration. The design document specified in this directory will be deployed to CouchDB with the id `_design/$DDOC`. See the [`test` design document](example/testdb/design/test) for a demonstration of how a design document is laid out.

## Configuration

### RC File

Configuration options can be specified in an RC file, found at `./kivikrc.json`, `./kivikrc.yml`, or `./kivikrc.yaml`. In addition, multiple sets of options can be specified using the `configs` property, e.g.

```yaml
user: usualUser
password: usualPassword
configs:
  production:
    url: http://production:5984
    user: productionuser
    password: productionPassword
  test:
    url: http://test:5984
```

These sets can be retrieved using e.g. `kivik --config production`. Anything inside a config set will override the options set in the main RC file object.

For now, the RC file is only read when invoking Kivik on the command line.

### Options

Configuration options that apply to all Kivik [operations](#Operations):

- `config` (`--config`): The key used to select one of the configs in the [RC File](#RC-File).
- `exclude` (`--exclude`): A list of paths or globs that Kivik will ignore when selecting subdirectories as databases. To specify more than one of these on the command line, use `--exclude` more than once. Default: `["node_modules", "schemas"]`
- `excludeDesign` (`--exclude-design`): A list of paths or globs that Kivik will ignore when searching for design document functions. This might be useful when writing test files alongside design document function files. To specify more than one of these on the command line, use `--exclude-design` more than once. Default: `["*.test.js"]
- `include` (`--include`): A list of paths or globs that Kivik will use to select subdirectories as databases. To specify more than one of these on the command line, use `--include` more than once. Default: ["*"]
- `logLevel` (`--log-level`): TODO: determine logger configuration
- `verbose` (`-v`, `-vv`, etc.): Determine how loud Kivik is when operating. By default, Kivik will only write to stdout if there's been an error, with a few useful exceptions when invoked in the command-line (information about which port the CouchDB container can be found at, for example). Programmatically this can be expressed as a number from 0 to 4.

Each operation has specific configuration options, as well.

## Operations

### Validate

(TODO: switch the arguments around?)

```shell
$ kivik validate path/to/file.json db
$ kivik validate https://example.com/file.json db
```

```js
import { getValidator } from "kivik";

const localFile = "path/to/file.json";
const remoteFile = "https://example.com/file.json";
const database = "db";

const validator = await getValidator("path/to/dir");
const dbValidate = validator(database);

const localResponse = await dbValidate(localFile);
const remoteResponse = await dbValidate(remoteFile);

// { valid: boolean, errors: string[] }
console.log(localResponse);
```

Validates a file against a database's schema.

Schema validation is handled by [Ajv](https://ajv.js.org). A database's schema can be located at `./schemas/$DB.json`, or `./$DB/schema.json` (but not both!). Every JSON file in `./schemas/` will be added to Ajv, and all of the schemas are added before validation takes place, which allows for references between schema files.

Validation also takes place on database fixtures, when the database has a schema.

### Deploy

```shell
$ kivik deploy --url http://couchserver:5984/ --user user --password password
```

```js
import { Kivik, nano } from "kivik";
import options from "./options";

const kivik = await Kivik.fromDirectory("path/to/dir", options);
const nano = nano(options);
await kivik.deploy(nano);
```

Deploys CouchDB configuration to a given server.

#### Options

- `url` (`--url`): The CouchDB endpoint to which the configuration is deployed. **(required)**
- `user` (`--user`) and `password` (`--password`): The user and password to authenticate requests with CouchDB. If unset, the deployment will be attempted with anonymous requests, which will frequently fail.
- `deployFixtures` (`--deploy-fixtures`): Setting this will deploy each database's set of fixtures, along with design documents and indexes. Fixtures are [validated](#Validate) if the database has a JSON Schema; invalid fixtures will not be deployed. Default: `false`
- `suffix` (`--suffix`): Append a suffix to each database name, which is useful if multiple deployments can happen to the same CouchDB server.

### Inspect

```shell
$ kivik inspect --user user --password password --port 12345
alert: Container weird_name started. View at http://localhost:12345/_utils
^C
alert: Container weird_name has been stopped and removed.
```

```js
import { Instance } from "kivik";
import options from "./options";

const instance = await Instance.get("path/to/dir", options);
await instance.start();
await instance.deploy();

// e.g.
const db = instance.nano.use("some_db");
const doc = await db.get("some_id");
```

Inspect Kivik's deployment output on an ephemeral Docker container. Kivik Instances can also be used for testing; once an instance has been started, `deploy()` and `destroy()` can be run multiple times.

#### Options

- `image` (`--image`): The CouchDB image used to create the container. The image will need to be pulled before the Instance can be started. Default: `couchdb:3.1`
- `port` (`--port`): The host port on which the container is exposed. If the port is unset or busy, a random available port is selected.
- `user` (`--user`) and `password` (`--password`): The name and password of the admin user that will be created when CouchDB is started. Defaults: `kivik` and `kivik` (TODO: actually set this)

## Logging

TODO: Add logging info

## Tests

```shell
$ git clone https://github.com/crkn-rcdr/kivik
$ cd kivik
$ docker pull couchdb:3.1
$ npm install
$ npm test
```

## Bugs, feature requests, etc.

[Find or submit an issue on GitHub.](https://github.com/crkn-rcdr/kivik/issues)
