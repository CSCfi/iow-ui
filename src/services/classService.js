const _ = require('lodash');
const jsonld = require('jsonld');
const frames = require('./frames');
const graphUtils = require('./graphUtils');
const utils = require('./utils');

module.exports = function classService($http, $q, predicateService) {
  'ngInject';
  return {
    getClass(id) {
      function frame(data) {
        return jsonld.promises.frame(data, frames.classFrame(data))
          .then(framedClass => {
            utils.ensurePropertyAsArray(graphUtils.graph(framedClass), 'property');
            return framedClass;
          });
      }
      return $http.get('/api/rest/class', {params: {id}}).then(response => frame(response.data));
    },
    getAllClasses() {
      return $http.get('/api/rest/class').then(response => {
        const frame = frames.classSearchFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    getClassesForModel(model) {
      return $http.get('/api/rest/class', {params: {model}}).then(response => {
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    },
    createClass(classData, id) {
      const requestParams = {
        id,
        model: classData['@graph'][0].isDefinedBy
      };
      return $http.put('/api/rest/class', classData, {params: requestParams});
    },
    updateClass(classData, id, originalId) {
      const requestParams = {
        id,
        model: classData['@graph'][0].isDefinedBy
      };
      if (id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/class', classData, {params: requestParams});
    },
    deleteClass(id, model) {
      const requestParams = {
        id,
        model: model
      };
      return $http.delete('/api/rest/class', {params: requestParams});
    },
    assignClassToModel(classId, modelId) {
      const requestParams = {
        id: classId,
        model: modelId
      };
      return $http.post('/api/rest/class', undefined, {params: requestParams});
    },
    getClassTemplate(context, modelID, classLabel, conceptID, lang) {
      return $http.get('/api/rest/classCreator', {params: {modelID, classLabel, conceptID, lang}})
        .then(response => {
          _.extend(response.data['@context'], context);
          const frame = frames.classFrame(response.data);
          return jsonld.promises.frame(response.data, frame);
        })
        .then(framedClass => {
          utils.ensurePropertyAsArray(graphUtils.graph(framedClass), 'property');
          return framedClass;
        });
    },
    getPropertyTemplate(predicateId) {
      return $q.all([
        predicateService.getPredicate(predicateId),
        $http.get('/api/rest/classProperty', {params: {predicateID: predicateId}}).then(response => response.data)
      ])
      .then(result => {
        const [predicate, property] = result;

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
