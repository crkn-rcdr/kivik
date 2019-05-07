# Changelog

Changes to `kivik` will be documented here.

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

[1.0.0]: https://github.com/crkn-rcdr/kivik/releases/tag/v1.0.0
