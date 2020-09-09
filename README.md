# kivik

`kivik` is a command-line utility for deploying CouchDB design documents.

## Usage

```
$ kivik inspect path/to/dir
$ kivik path/to/dir # same as above
$ kivik deploy . --server http://user:password@couchserver:5984/
$ kivik validate path/to/json/document.json path/to/json/schema.json
```

## Modes

`kivik inspect` (the default) will spin up a CouchDB Docker container, populate it with the fixtures and design documents specified in the target directory. Options:

- `image`: CouchDB image to run. The default is `couchdb:1.7`. You will need to pull the image to your machine before running `kivik`.
- `port`: The localhost port on which the CouchDB image will be accessible. The default is 5984.
- `couch-output`: Boolean determining whether the CouchDB image's standard output is streamed to your terminal. Default: false.
- `db`: Specify a particular database to inspect. You can use this option multiple times.
- `invalid-fixtures`: Insert fixtures that do not validate against the database's `schema.json`
- `quiet`: Suppress console.log output.

`kivik validate <document> <schema>` validates a JSON document against a JSON schema. Documents can be found locally or remotely, and the schema can be specified as either a file or a directory containing a `schema.json` file.

`kivik deploy` will deploy the design documents to the specified server. Options:

- `server`: Base URL of the server. The default is `http://localhost:5984/`. You can specify HTTP authentication in the URL; see the example above.
- `db`: Specify a particular database to deploy. You can use this option multiple times.
- `fixtures`: Insert fixtures located in target directory.
- `create-databases`: Create databases found in the target directory on the server.
- `quiet`: Suppress console.log output.

## Expected directory structure

See the `example` directory in this repo. Running `kivik` on the example directory will create and populate two databases, with fixtures and design documents loaded from `fixtures` and `design` content found in the their respective directory structures. Adding a `schema.json` file to a database directory will cause the fixtures to be validated against it. `kivik` supports view functions (maps and reduces), show functions, list functions, update functions, and filter functions. The functions are loaded as JavaScript and so syntax errors will be thrown; future versions of `kivik` may allow for more robust design document function testing.

## Programmatic use

### Inspection

You can initialize and run a kivik inspection database programmatically.

```
const Kivik = require("kivik");

const instance = new Kivik("path/to/directory", {
  // options
});
instance.run().then(() => {
  // do some stuff

  instance.kill();
});
```

### TestDeployer

Documentation on how to use TestDeployer is forthcoming.
