const jsonld = require('jsonld');

const frames = require('./frames');

module.exports = function propertyService($http, $q) {
  'ngInject';
  return {
    getProperty(predicate, context) {
      const data = {
        predicate: predicate,
        '@context': context
      };
      return jsonld.promises.expand(data).then(expanded => {
        const id = expanded[0]['http://www.w3.org/ns/shacl#predicate'][0]['@id'];
        return $http.get('/api/rest/property', {params: {id}});
      }).then(response => {
        const frame = frames.predicateFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    getPropertyById(id, userFrame = 'propertyFrame') {
      return $http.get('/api/rest/property', {params: {id}})
        .then(response => {
          const frame = frames[userFrame](response.data);
          return jsonld.promises.frame(response.data, frame);
        });
    },
    getPropertiesForModel(model) {
      return $http.get('/api/rest/property', {params: {model}}).then(response => {
        const propertyFrame = frames.propertyFrame(response.data);
        const associationFrame = frames.associationFrame(response.data);
        return $q.all({
          attributes: jsonld.promises.frame(response.data, propertyFrame),
          associations: jsonld.promises.frame(response.data, associationFrame)
        });
      });
    },
    updateProperty(property, originalId) {
      const requestParams = {
        model: property.isDefinedBy
      };
      return jsonld.promises.expand(property).then(expanded => {
        requestParams.id = expanded[0]['@id'];
        if (requestParams.id !== originalId) {
          requestParams.oldid = originalId;
        }
        return $http.post('/api/rest/property', property, {params: requestParams});
      });
    }
  };
};
