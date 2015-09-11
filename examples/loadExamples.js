/*eslint-disable */

'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

function reqOpts(path) {
  return {
    host: 'localhost',
    port: 8084,
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

makeRequest('/IOAPI/rest/groups', 'exampleGroups.json');
makeRequest('/IOAPI/rest/users', 'exampleUsers.json');
makeRequest('/IOAPI/rest/core?graph=http://urn.fi/urn:nbn:fi:csc-iow-doo#DooLibrary&group=urn:uuid:4925a5ee-3468-45c2-b31d-bc1cf644ef87',
  'exampleModelDOO.json');
makeRequest('/IOAPI/rest/core?graph=http://urn.fi/urn:nbn:fi:csc-iow-jhs#CoreLibrary&group=urn:uuid:7a389eed-9f66-4d3c-8c6f-199117562d70',
  'exampleModelJHS.json');
