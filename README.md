# iow-ui
Interoperability workbench user interface seed.  

## Usage
To run the build

    npm install
    npm start

To make a production build

    NODE_ENV=production npm run-script build

## Installing new npm dependencies
npm install will automatically read resolved package versions from npm-shrinkwrap.json. When you install new packages, you need to explicitly update the shrinkwrap file. Here is a short example.

    npm install --save foo-bar-x
    npm shrinkwrap

## Architechture
Interoperability user interface is separate one page application that uses IOW backend services. Backend design follows restful three layer architecture:

![Alt text](/Technical architecture.jpg "Technical architecture")


Backend:

https://github.com/CSC-IT-Center-for-Science/iow-api/

Database configuration:

https://github.com/CSC-IT-Center-for-Science/iow-database/

Private configuration:

https://github.com/CSC-IT-Center-for-Science/iow-playground/
