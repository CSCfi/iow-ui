const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(vocabularies, excludedClassMap = {}) {
      return $uibModal.open({
        template: require('./searchClassModal.html'),
        size: 'large',
        controller: SearchClassController,
        controllerAs: 'ctrl',
        resolve: {
          vocabularies: () => vocabularies,
          excludedClassMap: () => excludedClassMap
        }
      });
    }
  };
};

function SearchClassController($uibModalInstance, classService, modelLanguage, vocabularies, excludedClassMap, searchConceptModal) {
  'ngInject';

  const vm = this;
  let classes;

  vm.close = $uibModalInstance.dismiss;
  vm.selectedClass = null;
  vm.searchText = '';
  vm.modelId = '';
  vm.models = [];

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
    return klass.id === selectedClassId();
  };

  vm.confirm = () => {
    $uibModalInstance.close(selectedClassId());
  };

  vm.createNewClass = () => {
    return searchConceptModal.open(vocabularies, 'Define concept for the new class').result.then(result => {
      $uibModalInstance.close(result);
    });
  };

  function selectedClassId() {
    return vm.selectedClass && vm.selectedClass.id;
  }

  function localizedLabelAsLower(klass) {
    return modelLanguage.translate(klass.label).toLowerCase();
  }

  function textFilter(klass) {
    return !vm.searchText || localizedLabelAsLower(klass).includes(vm.searchText.toLowerCase());
  }

  function modelFilter(klass) {
    return !vm.modelId || klass.model.id === vm.modelId;
  }
}
