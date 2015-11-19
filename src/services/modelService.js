module.exports = function modelService($http, $q, modelCache, entities) {
  'ngInject';

  getAllRequires().then(allRequires => modelCache.updateRequires(allRequires));

  function getModelsByGroup(groupUrn) {
    return $http.get('/api/rest/model', { params: { group: groupUrn } })
      .then(response => entities.deserializeModelList(response.data));
  }

  function getModelByUrn(urn) {
    return $http.get('/api/rest/model', { params: { id: urn } })
      .then(response => entities.deserializeModel(response.data));
  }

  function createModel(model) {
    return $http.put('/api/rest/model', model.serialize(), { params: { id: model.id, group: model.groupId } })
      .then(() => model.unsaved = false);
  }

  function updateModel(model) {
    return $http.post('/api/rest/model', model.serialize(), { params: { id: model.id } });
  }

  function newModel({prefix, label, groupId}, lang) {
    return $http.get('/api/rest/modelCreator', { params: {prefix, label, lang} })
      .then(response => entities.deserializeModel(response.data))
      .then(model => {
        model.unsaved = true;
        model.groupId = groupId;
        return model;
      });
  }

  function newReference(scheme, lang) {
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

  function getAllRequires() {
    return $http.get('/api/rest/model')
      .then(response => entities.deserializeRequires(response.data));
  }

  function newRequire(namespace, prefix, label, lang) {
    return $http.get('/api/rest/modelRequirementCreator', {params: {namespace, prefix, label, lang}})
      .then(response => entities.deserializeRequire(response.data));
  }

  return {
    getModelsByGroup,
    getModelByUrn,
    createModel,
    updateModel,
    newModel,
    newReference,
    getAllRequires,
    newRequire
  };
};
