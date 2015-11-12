module.exports = function conceptService($http, $q, entities) {
  'ngInject';
  return {
    getAllSchemes(lang) {
      return $http.get('/api/rest/scheme', {params: {lang}});
    },
    getConceptSuggestion(id) {
      return $http.get('/api/rest/conceptSuggestion', {params: {conceptID: id}})
        .then(response => entities.deserializeConceptSuggestion(response.data));
    },
    getConceptSuggestions(schemeId) {
      return $http.get('/api/rest/conceptSuggestion', {params: {schemeID: schemeId}})
        .then(response => entities.deserializeConceptSuggestions(response.data));
    },
    createConceptSuggestion({schemeId, label, comment, lang}) {
      return $http.put('/api/rest/conceptSuggestion', null, {params: {schemeID: schemeId, label, comment, lang}})
        .then(response => response.data['@id']);
    },
    getConcept(id) {
      return $http.get('/api/rest/concept', {params: {uri: id}})
        .then(response => entities.deserializeConcept(response.data));
    },
    newConcept(id, label, comment, lang) {
      return $q.when({
        '@id': id,
        prefLabel: { [lang]: label },
        comment: comment
      })
      .then(reference => entities.deserializeConcept(reference));
    }
  };
};
