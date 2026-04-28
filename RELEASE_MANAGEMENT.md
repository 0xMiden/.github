# Release Management

This document describes the branching strategy, release process, and policies for managing breaking changes across Miden repositories.

## Branching Strategy

Development happens on a single branch (`next`). When a minor version is ready to ship, we create a dedicated branch for it (`release/vX.Y`). All releases of that minor version - the initial `vX.Y.0` and every later patch (`vX.Y.1`, ...) - are tagged from that branch. The branch is kept alive as long as we still ship patches for that minor version.

Once a release branch is cut, it is never merged back into `next`, and `next` is never merged into it. Fixes flow from `next` to release branches by cherry-pick, not by merge. This keeps the git history a clean DAG and avoids the divergence pain that comes from periodic back-and-forth merges between long-lived branches.

### Branches

- `next` - primary development branch. All new work targets `next`.
- `release/vX.Y` - stabilization branch for minor version X.Y. Created when the X.Y line is ready to release, kept around for as long as we still issue patch releases on that line. Hosts all `vX.Y.Z` patch tags.

### Key Principles

1. One release branch per minor version. `release/v0.14` hosts tags `v0.14.0`, `v0.14.1`, etc.
2. Create the release branch only when stabilization begins, not in anticipation. Until then, `next` is the development line.
3. Once a release branch exists, only non-breaking fixes and backports may merge to it.
4. All new features and breaking changes target `next`.
5. Try to keep any new changes non-breaking, if possible, to continue improving the latest released version.
6. Never merge `next` into a `release/*` branch (or vice versa). Backports happen by cherry-pick.
7. Fixes land on `next` first, then get backported. Unless a fix only makes sense on a release branch (e.g., it touches code that no longer exists on `next`), the change must land on `next` first; the backport PR against `release/vX.Y` references the original `next` PR.

## Breaking Changes

To start with, we will use a combination of CI enforcement (on the `release/*` branches) and a `[BREAKING]` label (on `next` PRs) to indicate breaking changes.

### CI Enforcement

All PRs run `cargo-semver-checks`, which compares the public API against a baseline.

For PRs targeting `release/*` branches, a detected breaking change blocks the merge.

### `[BREAKING]` Label

PRs that introduce breaking changes must carry a `[BREAKING]` label to indicate that they should not be backported to the latest released version. This is a backstop for cases that semver-checks may miss (e.g., behavioral changes, semantic guarantees), and feeds reviewer attention and changelog tooling. Label-flagged PRs targeting `release/*` are blocked from merging.

PRs with breaking changes should also include a migration note in the description.

## Release Process

### Creating a New Minor Version (X.Y.0)

1. Stabilize on `next`. Ensure all intended changes are merged and CI passes.
2. Cut the release branch. Create `release/vX.Y` from the desired commit on `next`.
3. Tag and publish. Create the GitHub release from `release/vX.Y`, which creates the `vX.Y.0` tag and triggers the publish automation (crates.io, GitHub release notes).

### Patch Releases (X.Y.Z where Z > 0)

1. Land the fix on `next` first via a normal PR.
2. Open a backport PR against `release/vX.Y`, cherry-picking the commit(s) and adapting as needed. Reference the original `next` PR in the description so it's easy to track which release branches received which fix. CI semver-checks blocks any breaking change.
3. Hotfix exception. If a fix only makes sense on the release branch (the affected code no longer exists on `next`), open the PR directly against `release/vX.Y` and note why it isn't going to `next`.
4. Tag and publish. Create a new GitHub release from `release/vX.Y`, which creates the `vX.Y.Z` tag and triggers publish automation.

The same `release/vX.Y` branch hosts all patch tags for the X.Y line. `next` and `release/*` branches are never merged into each other.

## Documentation

### Versioned Documentation

Documentation is built from:

- `release/vX.Y` branches for versioned/stable docs
- `next` branch for latest/development docs

The documentation site includes a version switcher to navigate between versions.

### Changelog

Each repository maintains a `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format. The changelog is:

- Updated with each PR (via CI enforcement)
- Used to generate release notes automatically
