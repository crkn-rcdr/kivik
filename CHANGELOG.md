# Changelog

## [2.0.0-alpha.8] - 2021-04-08

- `kivik deploy local` deploys to a running Kivik instance, unless a deployment with key `local` exists in the RC file.
- `kivik start` does not deploy by default.
- RC file deployments can set a `fixtures` flag to determine if deployments should also deploy fixtures. This is false by default.
- `kivik deploy` checks this flag (as well as the `local.fixtures` for `kivik deploy local`) when deploying.
- Minor instance API changes (I should probably document it better).

## [2.0.0-alpha.7] - 2021-04-08

- New CLI invocations: `kivik start`, `kivik watch`, `kivik stop`. `kivik inspect`, `kivik dev` and `kivik instance` are aliases of `kivik watch`, and nothing particularly new happens if you keep using those like you used to. `kivik start` and `kivik stop` start and stop the Kivik instance in the background.
- Log output has changed a bit. The new CLI option `--log-timestamp` toggles whether or not a timestamp is displayed.
- Use `Kivik.getInstance(directory: string, config?: InstanceConfig)` to interface with a running instance programmatically.
- `Kivik.createInstance(directory: string, attach?: boolean, config?: InstanceConfig)` accepts the `attach` boolean which causes it to attach to a running instance instead of creating a new one. If `attach === false`, `createInstance` will throw an exception if an instance is already running.

## [2.0.0-alpha.6] - 2021-04-06

- Dependency upgrade. Nano instances use one socket at a time, for safety.

## [2.0.0-alpha.5] - 2021-03-31

- Big TypeScript rewrite.
- BREAKING CHANGE: new RC file configuration, and a bunch of command-line options no longer work. See the README for details.
- RC file is read when invoking Kivik programmatically. (#46)
- `kivik dev` (a.k.a. `kivik instance`, a.k.a. `kivik inspect`) listens for changes you make to Kivik files and redeploys them.
- `kivik dev` config is handled in the RC file, in an `instance` object.
  - You can turn off deploying fixtures in this mode by setting `"fixtures": false` (#52)
- `kivik fixtures`: Test whether your database fixtures validate.
- CommonJS modules in `${db}/design/${ddoc}/lib/*.js` get added to the `lib` view of that design doc and can be referenced in other design doc functions. Kivik will follow symlinks for these (and anything else). (#3)

## [2.0.0-alpha.4] - 2021-03-09

- Incorporates the new [@crkn-rcdr/nano](https://github.com/crkn-rcdr/nano) package
- De-opinionates Kivik when it comes to validation. Supply any old function that returns a boolean (or an object where the valid property is a boolean) and Kivik will validate things based on that.

## [2.0.0-alpha.3] - 2021-02-22

- Validation checks subdirectories of `schemas/` for JSON files
- Database schemas found in `$DB/schema.json` are the only ones that can be referenced by `getValidator`

## [2.0.0-alpha.2] - 2021-02-22

- `kivik validate` positional arguments are saved

## [2.0.0-alpha.1] - 2021-02-19

- `kivik inspect` actually deploys Couch config

## [2.0.0-alpha.0] - 2021-02-19

- Just about everything has changed. See the current [README](README.md) for more information.

## [1.3.0] - 2020-07-08

### Added

- Inspect mode is made available programmatically. `require("kivik")` and you can set it up.
- Quiet mode, suppressing log output (error output is still produced). Use `--quiet`

### Fixed

- Files not ending in `.js` are no longer added into design docs

## [1.2.1] - 2020-07-06

### Fixed

- Bumps package.json version number
- Dependency upgrade

## [1.2.0] - 2020-07-06

### Added

- `kivik validate` mode: validate a JSON document against a JSON schema
- Databases will validate their fixtures against a schema.json file in their root directory
- By default, inspect mode will not insert invalid fixtures into the inspection database; use the `--insert-invalid-fixtures` flag to change this behaviour.

### Fixed

- Inspect mode will no longer fail if there's no design directory

## [1.1.2] - 2020-06-24

### Fixed

- Dependency upgrades

## [1.1.1] - 2019-08-01

### Fixed

- Inspect, deploy mode tested properly
- Multiple database promises handled correctly

## [1.1.0] - 2019-05-07

### Added

- List, show, filter function support

### Fixed

- Tests do not attempt to load data from an older directory structure.
- Design doc directories that do not contain subdirectories for every function type are loadable.
- You can use an absolute path as `kivik`'s argument.

## [1.0.0] - 2019-04-24

### Added

- `kivik inspect` mode
- `kivik deploy` mode
- Fixtures are imported into inspect mode databases
- Multiple databases support
- Multiple design document support
- View (map/reduce) and update function support within design documents

[2.0.0-alpha.8]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.8
[2.0.0-alpha.7]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.7
[2.0.0-alpha.6]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.6
[2.0.0-alpha.5]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.5
[2.0.0-alpha.4]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.4
[2.0.0-alpha.3]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.3
[2.0.0-alpha.2]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.2
[2.0.0-alpha.1]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.1
[2.0.0-alpha.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v2.0.0-alpha.0
[1.3.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.3.0
[1.2.1]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.2.1
[1.2.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.2.0
[1.1.2]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.1.2
[1.1.1]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.1.1
[1.1.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.1.0
[1.0.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.0.0
