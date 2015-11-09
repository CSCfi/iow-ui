const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  function openModal(references, type, excludedPredicateMap, model) {
    return $uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'large',
      controller: SearchPredicateController,
      controllerAs: 'ctrl',
      resolve: {
        references: () => references,
        type: () => type,
        excludedPredicateMap: () => excludedPredicateMap,
        model: () => model
      }
    });
  }

  return {
    open(references, type, excludedPredicateMap) {
      return openModal(references, type, excludedPredicateMap, null);
    },
    openWithPredicationCreation(model) {
      return openModal(model.references, null, {}, model);
    }
  };
};

function SearchPredicateController($scope, $uibModalInstance, references, type, excludedPredicateMap, model, predicateService, modelLanguage, searchConceptModal) {
  'ngInject';

  const vm = this;
  let predicates;

  $uibModalInstance.rendered.then(() => {
    $scope.editableFormController = angular.element(jQuery('#predicate-search-form')).controller('editableForm');
  });

  vm.close = $uibModalInstance.dismiss;
  vm.selectedPredicate = null;
  vm.searchText = '';
  vm.modelId = '';
  vm.models = [];
  vm.type = type;
  vm.types = [];
  vm.typeSelectable = !type;

  predicateService.getAllPredicates().then(allPredicates => {
    predicates = _.reject(allPredicates, predicate => excludedPredicateMap[predicate.id]);

    vm.models = _.chain(predicates)
      .map(predicate => predicate.model)
      .uniq(classModel => classModel.id)
      .value();

    vm.types = _.chain(predicates)
      .map(predicate => predicate.type)
      .uniq()
      .value();
  });

  vm.searchResults = () => {
    return _.chain(predicates)
      .filter(textFilter)
      .filter(modelFilter)
      .filter(typeFilter)
      .sortBy(localizedLabelAsLower)
      .value();
  };

  vm.selectPredicate = (predicate) => {
    $scope.editableFormController.cancel();
    predicateService.getPredicate(predicate.id).then(result => vm.selectedPredicate = result);
  };

  vm.isSelected = (predicate) => {
    return predicate.id === selectedPredicateId();
  };

  vm.usePredicate = () => {
    $uibModalInstance.close(selectedPredicateId());
  };

  vm.createAndUsePredicate = () => {
    return predicateService.createPredicate(vm.selectedPredicate).then(vm.usePredicate);
  };

  vm.createNew = (selectionOwlType) => {
    return searchConceptModal.open(references, 'Define concept for the new predicate').result
      .then(result => {
        if (!vm.typeSelectable) {
          $uibModalInstance.close(_.extend(result, {type: selectionOwlType}));
        } else {
          predicateService.newPredicate(model.context, model.id, result.label, result.conceptId, selectionOwlType, modelLanguage.getLanguage())
            .then(predicate => {
              vm.selectedPredicate = predicate;
              $scope.editableFormController.show();
            });
        }
      });
  };

  vm.isAttributeAddable = () => {
    return vm.typeSelectable || vm.type === 'attribute';
  };

  vm.isAssociationAddable = () => {
    return vm.typeSelectable || vm.type === 'association';
  };

  function selectedPredicateId() {
    return vm.selectedPredicate && vm.selectedPredicate.id;
  }

  function localizedLabelAsLower(predicate) {
    return modelLanguage.translate(predicate.label).toLowerCase();
  }

  function textFilter(predicate) {
    return !vm.searchText || localizedLabelAsLower(predicate).includes(vm.searchText.toLowerCase());
  }

  function modelFilter(predicate) {
    return !vm.modelId || predicate.model.id === vm.modelId;
  }

  function typeFilter(predicate) {
    return !vm.type || predicate.type === vm.type;
  }
}
