# App.geo.ca-v2

This project uses the [sveltekit](https://kit.svelte.dev/) framework and [sst](https://sst.dev/) to build and deploy to AWS a fullstack applications allowing for the search and cataloging of geospatial data.

## Setup

- Create a fork of the app.geo.ca-v2 repo for your personal development environment.
- Clone the repo in your dev environment using the following command in a new linux terminal: `git clone <Your-forked-repo-url>`
- Check to make sure node, npm, and nvm are installed with these commands:
  - `node -v`
  - `npm -v`
  - `nvm -v`
- If you get an error message for any of these commands, you will have to install the packages with these steps:
  - First install curl as a sudo user: `sudo apt-get install curl`
  - Next install nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash`
  - Test to make sure nvm installed successfully: `command -v nvm` Note: If successful 'nvm' will print. If nothing happens or an error is received, close and open a new terminal.
  - Next, install the latest stable version of node and npm run: `nvm install --lts` Note: A nodejs version that matches the `.nvmrc` may be required instead of the latest version. You can adjust the nvm install command by specifying the node version like this: `nvm install 18.20.8`. Just replace the number with the correct version.
  - Confirm node and npm were installed: `node -v` and `npm -v`
  - Check to make sure the correct version of npm is set as indicated by the `.nvmrc` file. See [nvm](https://github.com/nvm-sh/nvm).
- Navigate to your project's directory:`cd app.geo.ca-v2` Note: the name of your directory may differ based on the name of your forked repo.
- Instal node packages with: `npm i`
- Navigate to the `/packages/web-app/` directory using `cd packages/web-app`
- Instal node packages here too with: `npm i`

## Developing

After following the setup, start a development server with these steps:

- setup your aws credentials. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- Create a .env file for your stage. You can do this by copying the .env.dev but change ‘dev’ to the name of your stage.
- Set secrets for OIDC_CLIENT_SECRET and GEOCORE_API_DOMAIN. Add this for each stage you want to deploy or work on locally. e.g. `npx sst secrets set GEOCORE_API_DOMAIN https://geocore.api.geo.ca --stage <your-stage-name>`
- enshure your login and logout url's are configured correctly in aws cognito.

  - Allowed callback URLs
    - http://localhost:5173/en-ca/sign-in/receive
    - http://localhost:5173/fr-ca/sign-in/receive
  - Allowed sign-out URLs
    - http://localhost:5173/en-ca/sign-in/logout
    - http://localhost:5173/fr-ca/sign-in/logout

- For local development run `npm run dev`, open a new terminal, run `cd packages/web-app/ ` and `npm run dev`. Enter the name of your local stage if asked.
- For deployment, run `npx sst deploy --stage <yourStageName>`. You will need to deploy your environment in order to build any AWS resources like buckets and tables.
- now run the steps under [## Importing Data](#importing-data).

## Building and deploying

- setup your aws credentials for the desired environment. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- Create a .env file for your stage. You can do this by copying the .env.dev but change ‘dev’ to the name of your stage.
- Set secrets for OIDC_CLIENT_SECRET and GEOCORE_API_DOMAIN. Add this for each stage you want to deploy or work on locally. e.g. `npx sst secrets set GEOCORE_API_DOMAIN https://geocore.api.geo.ca --stage <your-stage-name>`
- from `/` run `npm i`.
- from `/packages/web-app/` run `npm i`. A nodejs version that matches the `.nvmrc` may be required.
- enshure your login and logout url's are configured correctly in aws cognito.

  - Example allowed callback URLs
    - https://d28mialgy1tfmv.cloudfront.net/en-ca/sign-in/receive
    - https://d28mialgy1tfmv.cloudfront.net/fr-ca/sign-in/receive
  - Example allowed sign-out URLs
    - https://d28mialgy1tfmv.cloudfront.net/en-ca/sign-in/logout
    - https://d28mialgy1tfmv.cloudfront.net/fr-ca/sign-in/logout

- deploy from the root of the repository: `npx sst deploy --stage <yourStageName>`

## Importing Data

Do the following while your project's server is running:

- From AWS, go to your S3 bucket list and find the bucket with a name like this: `<your-stage-name>-<your-project-name>-site-hnapbucket<some-other-random-characters>`
- Click on the bucket name from the list to see the bucket's details.
- From the Objects tab, click on the 'Create Folder' button and create two new folders with these names:
  - `geocore`
  - `hnap`
- From the hnap folder, copy the content from the project's `data-samples` folder.
- this will trigger the hnap-bridge lambda and generate the geojson records required for viewing and store them under `<your-bucket-name>/geojson`. Note that any record not imported this way will return a 404 when viewed.
