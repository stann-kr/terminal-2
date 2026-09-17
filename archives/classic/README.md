# Classic TERMINAL

The complete application before the Aspen design migration, frozen at `ca62273dc498af2f4a46c87c46d287d54df8ae79`. `source.tar.gz` includes the original Next routes, UI, API, public assets, package lock, migrations and patch verifier. `manifest.json` records its checksum and source commit. This snapshot is independent of changes to the current application.

From the repository root:

```bash
npm run archive:dev
```

The runner verifies and extracts the snapshot into `.design-archive/classic`, installs its locked dependencies on first use, and starts the old design at `http://127.0.0.1:3005`. To run both designs together:

```bash
npm run dev
# In another terminal:
npm run archive:dev -- --port 3006
```

`npm run archive:prepare` only extracts the source. `npm run archive:build` and `npm run archive:start -- --port 3006` build and serve the archived Next application.

Environment files and local D1 state are separate and are not copied from the current application. To use the archived API locally, prepare the archive's own development database:

```bash
cd .design-archive/classic
npx wrangler d1 migrations apply DB --env development --local
```

The runner does not deploy the snapshot or apply migrations. Node.js 22 or newer is required. The preserved source also includes the standalone Aspen reference under `mockups/`; the default archive command runs the old Next design.
