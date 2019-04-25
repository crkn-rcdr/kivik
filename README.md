# kivik

`kivik` is a command-line utility for deploying CouchDB design documents.

## Usage

```
$ kivik inspect path/to/dir
$ kivik path/to/dir # same as above
$ kivik deploy . --server http://user:password@couchserver:5984/
```

## Modes

`kivik inspect` (the default) will spin up a CouchDB Docker container, populate it with the fixtures and design documents specified in the target directory. Options:

- `image`: CouchDB image to run. The default is `couchdb:1.7`. You will need to pull the image to your machine before running kivik.
- `port`: The localhost port on which the CouchDB image will be accessible. The default is 5984.
- `couch-output`: Boolean determining whether the CouchDB image's standard output is streamed to your terminal. Default: false.
- `db`: Specify a particular database to inspect. You can use this option multiple times.

`kivik deploy` will deploy the design documents to the specified server. Options:

- `server`: Base URL of the server. The default is `http://localhost:5984/`. You can specify HTTP authentication in the URL; see the example above.
- `db`: Specify a particular database to deploy. You can use this option multiple times.

## Expected directory structure

See the `example` directory in this repo. Running kivik on the example directory will populate the `testdb` database with four fixture documents (if running in `inspect` mode) and one design document, `_design/test`, with two view maps and an update function. Design document functions are loaded from individual files, and can be expressed as actual JavaScript functions. Currently, only update and view functions are supported.

Subsequent versions of kivik will support the remaining types of design document functions, and will provide some functionality for making testing these functions easier.
