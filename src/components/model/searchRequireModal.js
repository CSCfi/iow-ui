const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(excludedRequireMap = {}, language) {
      return $uibModal.open({
        template: require('./searchRequireModal.html'),
        size: 'medium',
        controller: SearchRequireController,
        controllerAs: 'ctrl',
        resolve: {
          excludedRequireMap: () => excludedRequireMap,
          language: () => language
        }
      });
    }
  };
};

function SearchRequireController($uibModalInstance, excludedRequireMap, language, modelService, languageService, addRequireModal) {
  'ngInject';

  const vm = this;
  let requires;

  vm.close = $uibModalInstance.dismiss;
  vm.selectedRequire = null;
  vm.searchText = '';

  modelService.getAllRequires().then(result => {
    requires = _.map(_.reject(result, require => excludedRequireMap[require.id]));
  });

  vm.searchResults = () => {
    return _.chain(requires)
      .filter(textFilter)
      .sortBy(require => require.namespace)
      .value();
  };

  vm.selectRequire = (model) => {
    vm.selectedRequire = model;
  };

  vm.isSelected = (require) => {
    return require.id === (vm.selectedRequire && vm.selectedRequire.id);
  };

  vm.confirm = () => {
    $uibModalInstance.close(vm.selectedRequire);
  };

  vm.createNew = () => {
    addRequireModal.open(language).result
      .then($uibModalInstance.close);
  };

  function textFilter(model) {
    const search = vm.searchText.toLowerCase();

    function contains(text) {
      return (text || '').toLocaleLowerCase().includes(search);
    }

    return !vm.searchText || contains(languageService.translate(model.label)) || contains(model.namespace);
  }
}
