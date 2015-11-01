const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function predicateService($http) {
  'ngInject';

  return {
    createPropertyForPredicateId(predicateId) {
      return $http.get('/api/rest/classProperty', {params: {predicateID: predicateId}}).then(response => {
        const frame = frames.propertyFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
