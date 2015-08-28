const jsonld = require('jsonld');

angular.module('myApp.restapi.restapi-factory', [])

.factory('RestAPI', function restApiFactory($http) {
  const urlBase = '/IOAPI/rest/';
  return {
    getAvailableModels() {
        const chainedPromise = $http.get(urlBase + 'model-data', {
          headers: {
            Accept: 'application/ld+json'
          },
          params: {
            graph: 'default'
          }
        }).then(function gotAvailableModels(response) {
          const context = response.data['@context'];

          const frame = {
            '@type': 'sd:Service',
            defaultDataset: {
              '@type': 'sd:Dataset',
              defaultGraph: {
                '@type': 'sd:Graph'
              },
              availableGraphs: {
                namedGraph: {
                  '@embed': true
                }
              }
            }
          };
          frame['@context'] = context;
          return jsonld.promises.frame(response.data, frame);
        });

        return chainedPromise;
      },
    getModel(id) {
        const chainedPromise = $http.get(urlBase + 'model-data', {
          headers: {
            Accept: 'application/ld+json'
          },
          params: {
            graph: id
          }
        }).then(function gotModel(response) {
          const context = response.data['@context'];

          context.label = {
            '@id': 'http://www.w3.org/2000/01/rdf-schema#label',
            '@container': '@language'
          };

          context.comment = {
            '@id': 'http://www.w3.org/2000/01/rdf-schema#comment',
            '@container': '@language'
          };

          const frame = {
            '@type': 'iow:CoreComponentLibrary',
            classes: {
              property: {
                predicate: {
                  '@embed': false
                },
                valueClass: {
                  '@omitDefault': true,
                  '@default': [],
                  '@embed': false
                }
              }
            }
          };

          frame['@context'] = context;

          return jsonld.promises.frame(response.data, frame);
        });

        return chainedPromise;
      },
    getUsers() {
        return $http.get(urlBase + 'users', {
          headers: {
            Accept: 'application/ld+json'
          }
        });
      },
    getGroups() {
        return $http.get(urlBase + 'groups', {
          headers: {
            Accept: 'application/ld+json'
          }
        });
      },
    newUser(name, email) {
        return $http.put(urlBase + 'users', {
          params: {
            fullName: name,
            email: email
          }
        });
      },
    getUser(email) {
        return $http.get(urlBase + 'users', {
          headers: {
            Accept: 'application/ld+json'
          },
          params: {
            email: email
          }
        });
      }
  };
});
