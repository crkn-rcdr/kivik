# Changelog

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
