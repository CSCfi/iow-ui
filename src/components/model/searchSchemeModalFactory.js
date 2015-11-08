const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(excludedSchemeMap = {}) {
      return $uibModal.open({
        template: require('./searchSchemeModal.html'),
        size: 'medium',
        controller: SearchSchemeController,
        controllerAs: 'ctrl',
        resolve: {
          excludedSchemeMap: () => excludedSchemeMap
        }
      });
    }
  };
};

function SearchSchemeController($uibModalInstance, excludedSchemeMap, conceptService, modelLanguage, entities) {
  'ngInject';

  const vm = this;
  let schemes;

  vm.close = $uibModalInstance.dismiss;
  vm.selectedScheme = null;
  vm.searchText = '';

  conceptService.getAllSchemes(modelLanguage.getLanguage()).then(result => {
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
    $uibModalInstance.close(createReference(vm.selectedScheme));
  };

  function createReference(scheme) {
    return new entities.Reference(
      {
        '@id': `http://www.finto.fi/${scheme.id}`,
        '@type': 'skos:ConceptScheme',
        'dct:identifier': scheme.id,
        'title': {
          [modelLanguage.getLanguage()]: scheme.title
        }
      });
  }

  function textFilter(scheme) {
    return !vm.searchText || (scheme.title || '').toLowerCase().includes(vm.searchText.toLowerCase());
  }
}
