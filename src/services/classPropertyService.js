const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function classPropertyService($q, $http, $log, predicateService) {
  'ngInject';

  return {
    createPropertyForPredicateId(predicateId) {
      let predicate;

      return predicateService.getPredicateById(predicateId)
        .then(pred => {
          predicate = pred;
          return $http.get('/api/rest/classProperty', {params: {predicateID: predicateId}});
        })
        .then(response => {
          const property = response.data;

          _.extend(property['@context'], predicate['@context']);

          if (!property.label) {
            property.label = predicate['@graph'][0].label;
          }

          const predicateType = predicate['@graph'][0]['@type'];

          if (predicateType === 'owl:DatatypeProperty' && !property.datatype) {
            property.datatype = predicate['@graph'][0].range || 'xsd:string';
          } else if (predicateType === 'owl:ObjectProperty' && !property.valueClass) {
            property.valueClass = '';
          }

          const frame = frames.propertyFrame(property);
          return jsonld.promises.frame(property, frame);
        });
    }
  };
};
