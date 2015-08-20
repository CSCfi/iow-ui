const jsonld = require('jsonld');

angular.module('myApp.restapi.restapi-factory', [])
  .config(function restApiConfig($httpProvider) {
    $httpProvider.interceptors.push(function httpInterceptor($q, $log) {
      return {
        response: function responseInterceptor(response) {
          // Loggers on success
          $log.debug(response.headers()['content-type']);

          return response;
        },
        responseError: function errorInterceptor(response) {
          // Loggers on error
          return $q.reject(response);
        }
      };
    });
  })

.factory('RestAPI', ['$http', function restApiFactory($http) {
  const urlBase = 'http://localhost:8084/IOAPI/rest/';
  const RestAPI = {};

  RestAPI.getAvailableModels = function() {

    var chainedPromise = $http.get(urlBase + "model-data", {
      headers: {
        "Accept": "application/ld+json"
      },
      params: {
        "graph": "default"
      }

    }).then(function(response) {
      var context = response.data["@context"];

      var frame = {
        "@type": "sd:Service",
        "defaultDataset": {
          "@type": "sd:Dataset",
          "defaultGraph": {
            "@type": "sd:Graph"
          },
          "availableGraphs": {
            "namedGraph": {
              "@embed": true
            }
          }
        }
      };

      frame["@context"] = context;

      return jsonld.promises.frame(response.data, frame);

    });

    return chainedPromise;

  };

  RestAPI.getModel = function(id) {

    var chainedPromise = $http.get(urlBase + "model-data", {
      headers: {
        "Accept": "application/ld+json"
      },
      params: {
        "graph": id
      }

    }).then(function(response) {

      var context = response.data["@context"];

      context.label = {
        "@id": "http://www.w3.org/2000/01/rdf-schema#label",
        "@container": "@language"
      }

      context.comment = {
        "@id": "http://www.w3.org/2000/01/rdf-schema#comment",
        "@container": "@language"
      }

      var frame = {
        "@type": "iow:CoreComponentLibrary",
        "classes": {
          "property": {
            "predicate": {
              "@embed": false
            },
            "valueClass": {
              "@omitDefault": true,
              "@default": [],
              "@embed": false
            }
          }
        }
      };

      frame["@context"] = context;

      return jsonld.promises.frame(response.data, frame);

    });

    return chainedPromise;

  }

  RestAPI.getUsers = function() {
    return $http.get(urlBase + "users", {
      headers: {
        "Accept": "application/ld+json"
      }
    });
  };

  RestAPI.getGroups = function() {
    return $http.get(urlBase + "groups", {
      headers: {
        "Accept": "application/ld+json"
      }
    });
  };

  RestAPI.newUser = function(name, email) {
    return $http.put(urlBase + "users", {
      params: {
        "fullName": name,
        "email": email
      }
    });
  };

  RestAPI.getUser = function(email) {
    return $http.get(urlBase + "users", {
      headers: {
        "Accept": "application/ld+json"
      },
      params: {
        "email": email
      }
    });
  };

  return RestAPI;
}]);
