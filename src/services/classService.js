const _ = require('lodash');

module.exports = function classService($http, $q, predicateService, entities) {
  'ngInject';
  return {
    getClass(id) {
      return $http.get('/api/rest/class', {params: {id}}).then(response => entities.deserializeClass(response.data));
    },
    getAllClasses() {
      return $http.get('/api/rest/class').then(response => entities.deserializeClassList(response.data));
    },
    getClassesForModel(model) {
      return $http.get('/api/rest/class', {params: {model}}).then(response => entities.deserializeClassList(response.data));
    },
    createClass(classData) {
      const requestParams = {
        id: classData.id,
        model: classData.modelId
      };
      return $http.put('/api/rest/class', classData.serialize(), {params: requestParams});
    },
    updateClass(classData, originalId) {
      const requestParams = {
        id: classData.id,
        model: classData.modelId
      };
      if (requestParams.id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/class', classData.serialize(), {params: requestParams});
    },
    deleteClass(id, modelId) {
      const requestParams = {
        id,
        model: modelId
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
    newClass(context, modelID, classLabel, conceptID, lang) {
      return $http.get('/api/rest/classCreator', {params: {modelID, classLabel, conceptID, lang}})
        .then(response => {
          _.extend(response.data['@context'], context);
          return entities.deserializeClass(response.data);
        });
    },
    newProperty(predicateId) {
      return $q.all([
        predicateService.getPredicate(predicateId),
        $http.get('/api/rest/classProperty', {params: {predicateID: predicateId}}).then(response => response.data)
      ])
      .then(result => {
        const [predicate, property] = result;

        _.extend(property['@context'], predicate.context);

        if (!property.label) {
          property.label = predicate.label;
        }

        if (predicate.isAttribute() && !property.datatype) {
          property.datatype = predicate.range || 'xsd:string';
        } else if (predicate.isAssociation() && !property.valueClass) {
          property.valueClass = '';
        }

        return entities.deserializeProperty(property);
      });
    }
  };
};
