# App.geo.ca-v2

A full-stack application for searching and cataloging geospatial data, built with
[SvelteKit](https://kit.svelte.dev/) and deployed to AWS using [SST](https://sst.dev/).

## Quick start

1. Fork and clone this repository.
2. Follow the [developer setup](DEVELOPMENT.md#setup) to install Node.js, npm, and
   the workspace dependencies.
3. Configure AWS credentials, local environment values, and OIDC settings as
   described in [Developing](DEVELOPMENT.md#developing).
4. From the repository root, run:

   ```bash
   npm run dev
   ```

Local development uses SST and requires the configuration above; it is not a
standalone frontend-only server.

## Documentation

- [Developer guide](DEVELOPMENT.md): detailed setup, translation conventions,
  authentication, data model, deployment, and data imports.
- [Test guide](packages/web-app/src/lib/tests/README.md): running tests and choosing
  focused suites.
- [Favourites guide](docs/FAVOURITES.md): feature architecture and implementation details.
- [Copilot instructions](.github/copilot-instructions.md): concise guidance for AI contributions.
