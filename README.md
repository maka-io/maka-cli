<p align="center">
  <img src="https://www.maka-cli.com/logo_scaffold@2x.png" alt="alt text" height="400">
</p>

## About

This package wraps [@maka/maka-cli](https://www.npmjs.com/package/@maka/maka-cli) and includes a critical patch for handling paths with special characters (like `&`).

### Bug Fix: Ampersand (&) in Paths

**Problem:** When a Meteor app's project path contained an ampersand (`&`) character, config files couldn't be read on startup. For example, paths like `/Users/Tom & Jerry/my-meteor-app/` would fail.

**Root Cause:** The `mpi.class.js` in `@maka/maka-cli` was using:
1. `spawn()` with `shell: true`, causing `&` to be interpreted as a shell background operator
2. `execSync()` with string concatenation, which didn't properly escape special characters

**Solution:** This package includes a postinstall script that patches `@maka/maka-cli` to:
1. Remove `shell: true` from spawn calls (so paths aren't shell-interpreted)
2. Use `spawnSync()` with array arguments instead of string concatenation

## Installation

```bash
npm i -g maka-cli
```

Or if you prefer to use the upstream package directly:

```bash
npm i -g @maka/maka-cli
```

## Manual Patch (if needed)

If you're using `@maka/maka-cli` directly and encounter the ampersand issue, you can manually apply the fix:

1. Find `node_modules/@maka/maka-cli/bundle/typescript/src/tools/mpi/mpi.class.js`
2. In the `invokeMeteorCommand` function, remove `shell: true` from the spawn call
3. Replace `execSync(\`${this.meteor} ${runArgs.join(' ')}\`, ...)` with `spawnSync(this.meteor, runArgs, ...)`

## About Maka-CLI

Maka-CLI is a command line tool, which organizes a web application's file structure and automates everyday package installation tasks for various application frameworks
(i.e., React, GraphQL, Rest API, Material-UI, Jasmine / Mocha Tests). Maka-CLI integrates with MeteorJS for developing high performing and scaling
NodeJS backed applications deployed to on-prem and cloud-based infrastructures.

Please visit www.maka-cli.com for more information and documentation as well as examples and tutorials.

## Getting Started

Documentation has moved over to:

[maka-cli.com](https://www.maka-cli.com/documentation#documentation)
