module.exports = function conceptService($http, entities) {
  'ngInject';
  return {
    getAllSchemes(lang) {
      return $http.get('/api/rest/scheme', {params: {lang}});
    },
    getConceptSuggestions(schemeId) {
      return $http.get('/api/rest/conceptSuggestion', {params: {schemeID: schemeId}})
        .then(response => entities.deserializeConceptSuggestion(response.data));
    },
    createConceptSuggestion({schemeId, label, comment, lang}) {
      return $http.put('/api/rest/conceptSuggestion', null, {params: {schemeID: schemeId, label, comment, lang}})
        .then(response => response.data['@id']);
    }
  };
};
