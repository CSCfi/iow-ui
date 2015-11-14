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
    createClass(klass) {
      const requestParams = {
        id: klass.id,
        model: klass.modelId
      };
      return $http.put('/api/rest/class', klass.serialize(), {params: requestParams})
       .then(() => klass.unsaved = false);
    },
    updateClass(klass, originalId) {
      const requestParams = {
        id: klass.id,
        model: klass.modelId
      };
      if (requestParams.id !== originalId) {
        requestParams.oldid = originalId;
      }
      return $http.post('/api/rest/class', klass.serialize(), {params: requestParams});
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
    newClass(model, classLabel, conceptID, lang) {
      return $http.get('/api/rest/classCreator', {params: {modelID: model.id, classLabel, conceptID, lang}})
        .then(response => {
          _.extend(response.data['@context'], model.context);
          return entities.deserializeClass(response.data);
        })
        .then(klass => {
          klass.unsaved = true;
          return klass;
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
