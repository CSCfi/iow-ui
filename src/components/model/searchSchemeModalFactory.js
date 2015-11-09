const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(excludedSchemeMap = {}, language) {
      return $uibModal.open({
        template: require('./searchSchemeModal.html'),
        size: 'medium',
        controller: SearchSchemeController,
        controllerAs: 'ctrl',
        resolve: {
          excludedSchemeMap: () => excludedSchemeMap,
          language: () => language
        }
      });
    }
  };
};

function SearchSchemeController($uibModalInstance, excludedSchemeMap, conceptService, language) {
  'ngInject';

  const vm = this;
  let schemes;

  vm.close = $uibModalInstance.dismiss;
  vm.selectedScheme = null;
  vm.searchText = '';

  conceptService.getAllSchemes(language).then(result => {
    schemes = _.reject(result.data.vocabularies, scheme => excludedSchemeMap[scheme.id]);
  });

  vm.searchResults = () => {
    return _.chain(schemes)
      .filter(textFilter)
      .sortBy(scheme => scheme.title)
      .value();
  };

  vm.selectScheme = (scheme) => {
    vm.selectedScheme = scheme;
  };

  vm.isSelected = (scheme) => {
    return scheme.id === (vm.selectedScheme && vm.selectedScheme.id);
  };

  vm.confirm = () => {
    $uibModalInstance.close(vm.selectedScheme);
  };

  function textFilter(scheme) {
    return !vm.searchText || (scheme.title || '').toLowerCase().includes(vm.searchText.toLowerCase());
  }
}
