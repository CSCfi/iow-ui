module.exports = function modelService($http, $q, entities, modelLanguage) {
  'ngInject';
  return {
    getModelsByGroup(groupUrn) {
      return $http.get('/api/rest/model', {
        params: {
          group: groupUrn
        }
      })
      .then(response => entities.deserializeModelList(response.data));
    },
    getModelByUrn(urn) {
      return $http.get('/api/rest/model', {
        params: {
          id: urn
        }
      })
      .then(response => entities.deserializeModel(response.data));
    },
    updateModel(model) {
      return $http.post('/api/rest/model', model.serialize(), {
        params: {
          id: model.id
        }
      });
    },
    newReference(scheme) {
      return $q.when({
        '@id': `http://www.finto.fi/${scheme.id}`,
        '@type': 'skos:ConceptScheme',
        'dct:identifier': scheme.id,
        'title': {
          [modelLanguage.getLanguage()]: scheme.title
        }
      })
      .then(reference => entities.deserializeReference(reference));
    }
  };
};
