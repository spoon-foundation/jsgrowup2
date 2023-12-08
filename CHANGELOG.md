# Changelog

## [1.0.3] - 2023-12-08

### Fixed
- *Actually* resolve dynamic import issues when this package is bundled with tools
  such as using rollup.

## [1.0.2] - 2023-12-07

### Fixed
- Attempt to resolve dynamic import issues when this package is bundled with tools
  such as using rollup. This involved refactoring LMS data to be contained in JSON
  files rather than Typescript ones, and some fiddling with package.json settings. 

## [1.0.1] - 2023-09-19

### Fixed
- ESM version should actually work now. Note that it's targeting es2016 now.

### Removed

- CommonJS support

## [1.0] - 2023-09-11

- Initial release

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
