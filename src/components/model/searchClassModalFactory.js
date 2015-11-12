const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  function open(references, excludedClassMap, onlySelection) {
    return $uibModal.open({
      template: require('./searchClassModal.html'),
      size: 'large',
      controller: SearchClassController,
      controllerAs: 'ctrl',
      resolve: {
        references: () => references,
        excludedClassMap: () => excludedClassMap,
        onlySelection: () => onlySelection
      }
    });
  }

  return {
    open(references, excludedClassMap = {}) {
      return open(references, excludedClassMap, false);
    },
    openWithOnlySelection() {
      return open([], {}, true);
    }
  };
};

function SearchClassController($uibModalInstance, classService, languageService, references, excludedClassMap, onlySelection, searchConceptModal) {
  'ngInject';

  const vm = this;
  let classes;

  vm.close = $uibModalInstance.dismiss;
  vm.selectedClass = null;
  vm.searchText = '';
  vm.modelId = '';
  vm.models = [];
  vm.onlySelection = onlySelection;

  classService.getAllClasses().then(allClasses => {
    classes = _.reject(allClasses, klass => excludedClassMap[klass.id]);

    vm.models = _.chain(classes)
      .map(klass => klass.model)
      .uniq(model => model.id)
      .value();
  });

  vm.searchResults = () => {
    return _.chain(classes)
      .filter(textFilter)
      .filter(modelFilter)
      .sortBy(localizedLabelAsLower)
      .value();
  };

  vm.selectClass = (klass) => {
    classService.getClass(klass.id).then(result => vm.selectedClass = result);
  };

  vm.isSelected = (klass) => {
    return klass.id === (vm.selectedClass && vm.selectedClass.id);
  };

  vm.confirm = () => {
    $uibModalInstance.close(vm.selectedClass);
  };

  vm.createNewClass = () => {
    return searchConceptModal.openNewCreation(references, 'class').result.then($uibModalInstance.close);
  };

  function localizedLabelAsLower(klass) {
    return languageService.translate(klass.label).toLowerCase();
  }

  function textFilter(klass) {
    return !vm.searchText || localizedLabelAsLower(klass).includes(vm.searchText.toLowerCase());
  }

  function modelFilter(klass) {
    return !vm.modelId || klass.model.id === vm.modelId;
  }
}
