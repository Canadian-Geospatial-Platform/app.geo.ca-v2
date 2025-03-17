# App.geo.ca-v2

This project uses the [sveltekit](https://kit.svelte.dev/) framework and [sst](https://sst.dev/) to build and deploy to AWS a fullstack applications allowing for the search and cataloging of geospatial data.

## Developing

Once you've created a project and installed dependencies with `npm install`, start a development server:

- setup your aws credentials. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- set the correct version of npm as indicated by the `.nvmrc` file. see [nvm](https://github.com/nvm-sh/nvm) for macos/linux and [nvm-windows](https://github.com/coreybutler/nvm-windows) for windows.
- open a new terminal
- from `/` run `npm i`.
- from `/packages/web-app/` run `npm i`. A nodejs version that matches the `.nvmrc` may be required.
- enshure the correct [secrets](https://sst.dev/chapters/handling-secrets-in-sst.html) are configured. (Use npx instead of pnpm).
- enshure your login and logout url's are configured correctly in aws cognito.

  - Allowed callback URLs
    - http://localhost:5173/en-ca/sign-in/receive
    - http://localhost:5173/fr-ca/sign-in/receive
  - Allowed sign-out URLs
    - http://localhost:5173/en-ca/sign-in/logout
    - http://localhost:5173/fr-ca/sign-in/logout

- `npm run sst:dev` to deploy the required code to the cloud.
- open another terminal
- `npm run dev` to bind the the previously deployed infrastructure
- you should now be able to work on you local files and have your dev instance seamlessly connect to your aws ressources.
- now run the steps under [## Importing Data](#importing-data).

## Building and deploying

- setup your aws credentials for the desired environment. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- enshure the correct [secrets](https://sst.dev/chapters/handling-secrets-in-sst.html) are configured. (Use npx instead of pnpm).
- from `/` run `npm i`.
- from `/packages/web-app/` run `npm i`. A nodejs version that matches the `.nvmrc` may be required.
- enshure your login and logout url's are configured correctly in aws cognito.

  - Example allowed callback URLs
    - https://d28mialgy1tfmv.cloudfront.net/en-ca/sign-in/receive
    - https://d28mialgy1tfmv.cloudfront.net/fr-ca/sign-in/receive
  - Example allowed sign-out URLs
    - https://d28mialgy1tfmv.cloudfront.net/en-ca/sign-in/logout
    - https://d28mialgy1tfmv.cloudfront.net/fr-ca/sign-in/logout

- deploy from the root of the repository: `npm run sst:deploy:{dev|stage|prod}`
- import data: todo.

## Importing Data

- locate the `abc-datalake-xyz` bucket for your deployment.
- upload the data from `data-samples` to the correct location (abc-datalake-xyz/hnap/).

```BASH
  aws s3 cp data-samples/hnap s3://abc-datalake-xyz/ --recursive
```

- this will trigger the hnap-bridge lambda and generate the geojson records required for viewing and store them under `abc-datalake-xyz/geojson`. Note that any record not imported this way will return a 404 when viewed.
