# Development and release

## Checks

Use Node.js 24 and the committed npm lockfile. Install dependencies with lifecycle scripts disabled:

```sh
npm ci --ignore-scripts
npm audit --omit=dev
npm audit
npm run lint
npm test
npm run build
npm pack --dry-run --ignore-scripts
```

The production audit is a release gate. Review the full audit as well. n8n's development tools and framework type dependencies currently have upstream advisories. They are not bundled in this package. Do not use `npm audit fix --force` or replace framework dependencies across major versions to hide those findings. n8n's strict package rules also prohibit dependency overrides.

For an isolated build, copy the source into a temporary Docker volume and run these commands as a non-root user in the official Node.js image. Use a read-only root filesystem, resource limits and no Docker socket, host credentials or writable host mounts. Run dependency installation before supplying any publishing credentials. Remove the temporary environment after testing.

The contract tests check request definitions, credential configuration, pagination expressions, path encoding and response formatting. They transpile TypeScript and substitute the n8n connection-type enum. They do not run n8n's execution engine. Run the official lint and build commands as well as runtime workflow checks.

## Runtime checks

1. Install the built package in a fresh self-hosted n8n instance.
2. Add your Rephonic API credential. Keep the key out of source, screenshots, fixtures and recordings.
3. Import the example workflow, select the credential and run all three operations.
4. Check pagination, an empty search, an invalid ID, invalid credentials and an API error.
5. Attach the node as an AI Agent tool and verify the tool result and output controls.
6. Check the Creator Portal's current evidence requirements before recording a submission demo.

Use temporary test credentials and remove the instance's credential data after testing. Keep real API keys out of Docker images and build environments.

## Release

Source: [getrephonic/n8n-nodes-rephonic](https://github.com/getrephonic/n8n-nodes-rephonic). Package: `n8n-nodes-rephonic`.

Commit the reviewed source and lockfile, then release a version tag matching `package.json`. The publish workflow uses pinned GitHub Actions, installs the lockfile with lifecycle scripts disabled, audits production dependencies, reports development advisories, runs lint/tests/build and publishes with npm provenance. It never automatically commits or bumps versions. Publication skips lifecycle scripts because the verified build has already run and build tools should not receive a publishing token.

Configure an npm trusted publisher for this repository and `publish.yml`. If npm requires a token for initial publication, grant only the access needed to publish this package and store it in the repository's `NPM_TOKEN` Actions secret. Never commit a token or `.npmrc`. Remove a temporary bootstrap token after trusted publishing works.

After publication, run n8n's community package scanner against the released version, verify npm provenance and source links, and submit the npm URL through the Creator Portal. Only describe the package as verified or Cloud-installable after n8n approves it.
