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

function reqOpts(path,type) {
  return {
    host: argv.host,
    port: argv.port,
    path: path,
    method: type,
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
  var req;
  if(fileName!=null) {
  req = http.request(reqOpts(requestPath,"PUT"), logger);
  req.write(fs.readFileSync(path.join(__dirname, fileName)));
} else {
  req =  http.request(reqOpts(requestPath,"GET"), logger);
}
  req.end();
}

//makeRequest('/api/rest/drop');
makeRequest('/api/rest/groups', 'exampleGroups.json');
makeRequest('/api/rest/importModel?graph=http://iow.csc.fi/ns/doo&group=https://tt.eduuni.fi/sites/csc-iow#KTK',
  'exampleModelDOO.json');
makeRequest('/api/rest/importModel?graph=http://iow.csc.fi/ns/jhs&group=https://tt.eduuni.fi/sites/csc-iow#JHS',
  'exampleModelJHS.json');
