module.exports = function modelService($http, $q, entities) {
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
    createModel(model, groupId) {
      return $http.put('/api/rest/model', model.serialize(), {
        params: {
          id: model.id,
          group: groupId
        }
      });
    },
    updateModel(model) {
      return $http.post('/api/rest/model', model.serialize(), {
        params: {
          id: model.id
        }
      });
    },
    newModel(prefix, label, lang) {
      return $http.get('/api/rest/modelCreator', {params: {prefix, label, lang}})
        .then(response => entities.deserializeModel(response.data));
    },
    newReference(scheme, lang) {
      return $q.when({
        '@id': `http://www.finto.fi/${scheme.id}`,
        '@type': 'skos:ConceptScheme',
        'dct:identifier': scheme.id,
        'title': {
          [lang]: scheme.title
        }
      })
      .then(reference => entities.deserializeReference(reference));
    }
  };
};
