# Release Management

This document describes the branching strategy and release process across Miden repositories.

## Branching Strategy

Development happens on a single branch (`next`). When a minor version is ready to ship, we create a dedicated branch for it (`release/vX.Y`). All releases of that minor version - the initial `vX.Y.0` and every later patch (`vX.Y.1`, ...) - are tagged from that branch. The branch is kept alive as long as we still ship patches for that minor version.

Fixes flow from `next` to release branches by cherry-pick, not by merge.

### Branches

- `next` - primary development branch. All new work targets `next`.
- `release/vX.Y` - stabilization branch for minor version X.Y. Created when the X.Y line is ready to release, kept around for as long as we still issue patch releases on that line. Hosts all `vX.Y.Z` patch tags.

### Key Principles

1. One release branch per minor version. `release/v0.14` hosts tags `v0.14.0`, `v0.14.1`, etc.
2. Create the release branch only when the minor version is ready to ship, not in anticipation. Until then, `next` is the development line.
3. Once a release branch exists, only non-breaking changes may merge to it.
4. Try to keep any new changes non-breaking, if possible, to continue improving the latest released version.
5. Never merge `next` into a `release/*` branch (or vice versa). Backports from `next` to `release/*` happen by cherry-pick.
6. All changes land on `next` first, then get backported to `release/*` if they are non-breaking (unless a fix only makes sense on a release branch, e.g., a hotfix touching code that no longer exists on `next`). The backport PR against `release/vX.Y` references the original `next` PR.

## Breaking Changes

We will use a combination of CI enforcement (on the `release/*` branches) and a `[BREAKING]` label (on `next` PRs) to indicate breaking changes.

### CI Enforcement

All PRs run `cargo-semver-checks`, which compares the public API against a baseline.

For PRs targeting `release/*` branches, a detected breaking change blocks the merge.

### `[BREAKING]` Label

PRs against `next` that introduce breaking changes must carry a `[BREAKING]` label to indicate that they should not be backported to the latest release branch.

## Release Process

### Creating a New Minor Version (X.Y.0)

1. Prepare the changes on `next`.
2. Cut the release branch. Create `release/vX.Y` from the desired commit on `next`.
3. Tag and publish. Create the GitHub release from `release/vX.Y` branch (including the creation of a new `vX.Y.0` tag), which triggers the publish automation to crates.io.

### Patch Releases (X.Y.Z where Z > 0)

1. Land the fix on `next` first via a normal PR.
2. Open a backport PR against `release/vX.Y`, cherry-picking the commit(s) and adapting as needed. Reference the original `next` PR in the description so it's easy to track which release branches received which fix. CI semver-checks blocks any breaking change.
3. Tag and publish as above.

## Documentation

Documentation is built from:

- `release/vX.Y` branches for versioned (stable) documentation
- `next` branch for latest (development) documentation
