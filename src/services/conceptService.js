module.exports = function conceptService($http) {
  'ngInject';
  return {
    getAllSchemes(lang) {
      return $http.get('/api/rest/scheme', {params: {lang}});
    },
    createConceptSuggestion(schemeID, label, comment) {
      return $http.put('/api/rest/conceptSuggestion', null, {params: {schemeID, label, comment}}).then(response => response.data['@id']);
    }
  };
};
