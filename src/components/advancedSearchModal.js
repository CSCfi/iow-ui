const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open() {
      return $uibModal.open({
        template: require('./advancedSearchModal.html'),
        size: 'medium',
        controller: AdvancedSearchController,
        controllerAs: 'ctrl'
      });
    }
  };
};

function AdvancedSearchController($scope, $uibModalInstance, searchService, languageService) {
  'ngInject';

  const vm = this;
  let apiSearchResults = [];

  vm.close = $uibModalInstance.dismiss;
  vm.types = ['model', 'class', 'attribute', 'association'];
  vm.searchText = '';
  vm.searchTypes = _.clone(vm.types);

  $scope.$watch(() => vm.searchText, search);

  function search(text) {
    if (text) {
      searchService.searchAnything(vm.searchText, languageService.getModelLanguage())
        .then(searchResults => apiSearchResults = searchResults);
    } else {
      apiSearchResults = [];
    }
  }

  vm.selectSearchResult = searchResult => {
    if (searchResult.iowUrl) {
      $uibModalInstance.close(searchResult);
    }
  };

  vm.searchResults = () => {
    return _.chain(apiSearchResults)
      .sortBy(localizedLabelAsLower)
      .filter(typeFilter)
      .value();
  };

  function localizedLabelAsLower(searchResult) {
    return languageService.translate(searchResult.label).toLowerCase();
  }

  function typeFilter(searchResult) {
    return vm.searchTypes.indexOf(searchResult.type) !== -1;
  }
}
