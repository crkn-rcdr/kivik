# Changelog

Changes to `kivik` will be documented here.

## Current

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

[1.2.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.2.0
[1.1.2]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.1.2
[1.1.1]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.1.1
[1.1.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.1.0
[1.0.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.0.0
