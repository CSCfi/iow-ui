module.exports = function conceptService($http) {
  'ngInject';
  return {
    getAllSchemes(lang) {
      return $http.get('/api/rest/scheme', {params: {lang}});
    },
    createConceptSuggestion({schemeId, label, comment, lang}) {
      return $http.put('/api/rest/conceptSuggestion', null, {params: {schemeID: schemeId, label, comment, lang}})
        .then(response => response.data['@id']);
    }
  };
};
