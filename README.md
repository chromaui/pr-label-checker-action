# PR Label Checker Action

A GitHub Action that requires PR labels before merging.

## Usage

Create a `check-labels.yml` file in `.github/workflows`:

```yaml
name: Check PR Labels
on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  check-labels:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - uses: chromaui/pr-label-checker-action
        with:
          one-of: |
            major, minor, patch
            release, skip-release
          none-of: DO NOT MERGE
```

Supported inputs are `all-of`, `one-of` and `none-of` and can be used together. If you want to specify multiple of the same type (e.g. `one-of`) you can use a newline to create multiple groups of labels. In the above example, one of `major`/`minor`/`patch` must be present, as well as one of `release`/`skip-release`. Also, `DO NOT MERGE` may not be present on the PR.

PR labels are read from the original workflow context, which means any labels that are added/removed as part of the workflow will not be considered.
