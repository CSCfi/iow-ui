/*eslint-disable */

'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

var argv = require('optimist')
  .default({
    host: 'localhost',
    port: 8084
  })
  .argv;

function reqOpts(path) {
  return {
    host: argv.host,
    port: argv.port,
    path: path,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

function logger(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
}

function makeRequest(requestPath, fileName) {
  var req = http.request(reqOpts(requestPath), logger);
  req.write(fs.readFileSync(path.join(__dirname, fileName)));
  req.end();
}

makeRequest('/api/rest/groups', 'exampleGroups.json');
makeRequest('/api/rest/users', 'exampleUsers.json');
makeRequest('/api/rest/model?graph=http://urn.fi/urn:nbn:fi:csc-iow-doo&group=urn:uuid:4925a5ee-3468-45c2-b31d-bc1cf644ef87',
  'exampleModelDOO.json');
makeRequest('/api/rest/model?graph=http://urn.fi/urn:nbn:fi:csc-iow-jhs&group=urn:uuid:7a389eed-9f66-4d3c-8c6f-199117562d70',
  'exampleModelJHS.json');
