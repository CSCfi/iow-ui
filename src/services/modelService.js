module.exports = function modelService($http, entities) {
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
    }
  };
};
