# App.geo.ca-v2

This project uses the [sveltekit](https://kit.svelte.dev/) framework and [sst](https://sst.dev/) to build and deploy to AWS a fullstack applications allowing for the search and cataloging of geospatial data.

## Developing

Once you've created a project and installed dependencies with `npm install`, start a development server:

- setup your aws credentials. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- set the correct version of npm as indicated by the `.nvmrc` file. see [nvm](https://github.com/nvm-sh/nvm) for macos/linux and [nvm-windows](https://github.com/coreybutler/nvm-windows) for windows.
- open a new terminal
- install dependencies: `npm i`
- enshure the correct [secrets](https://sst.dev/chapters/handling-secrets-in-sst.html) are configured.
- run `sst:dev` to deploy the required code to the cloud.
- open another terminal
- `npm run dev` to bind the the previously deployed infrastructure
- you should now be able to work on you local files and have your dev instance seemlessly connect to your aws ressources.

## Building and deploying

- setup your aws credentials for prod. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- enshure the correct [secrets](https://sst.dev/chapters/handling-secrets-in-sst.html) are configured.
- deploy: `npm run sst:deploy`
