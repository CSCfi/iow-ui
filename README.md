# iow-ui
Interoperability workbench user interface  

## Usage
To run the build

    npm install
    npm start

To make a production build

    npm install
    NODE_ENV=production npm run-script build

## Installing new npm dependencies
npm install will automatically read resolved package versions from npm-shrinkwrap.json. When you install new packages, you need to explicitly update the shrinkwrap file. Here is a short example.

    npm install --save foo-bar-x
    npm shrinkwrap

## Loading example data
To load example data to a local api/fuseki installation, run

    npm run-script example-data

To load example data to a custom host and/or port

    npm run-script example-data -- --host 127.0.0.1 --port 8080

## Updating translation file

    npm run-script create-translations

Copy new entries from `template.pot` to `po` translation files or use "Update from POT file" if using poedit.

## Architechture
Interoperability user interface is separate one page application that uses IOW backend services. Backend design follows restful three layer architecture:

![Alt text](/Technical architecture.jpg "Technical architecture")


Backend:

https://github.com/CSC-IT-Center-for-Science/iow-api/

Database configuration:

https://github.com/CSC-IT-Center-for-Science/iow-database/

Private configuration:

https://github.com/CSC-IT-Center-for-Science/iow-playground/
