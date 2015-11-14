const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  function openModal(references, type, excludedPredicateMap) {
    return $uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'large',
      controller: SearchPredicateController,
      controllerAs: 'ctrl',
      resolve: {
        references: () => references,
        type: () => type,
        excludedPredicateMap: () => excludedPredicateMap
      }
    });
  }

  return {
    open(references, type, excludedPredicateMap) {
      return openModal(references, type, excludedPredicateMap);
    },
    openWithPredicationCreation(model) {
      return openModal(model.references, null, {});
    }
  };
};

function SearchPredicateController($scope, $uibModalInstance, references, type, excludedPredicateMap, predicateService, languageService, searchConceptModal) {
  'ngInject';

  const vm = this;
  let predicates;

  $uibModalInstance.rendered.then(() => {
    $scope.formController = angular.element(jQuery('#predicate-search-form')).controller('form');
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
    $scope.formController.editing = false;
    $scope.formController.submitError = false;
    predicateService.getPredicate(predicate.id).then(result => vm.selectedPredicate = result);
  };

  vm.isSelected = (predicate) => {
    return predicate.id === (vm.selectedPredicate && vm.selectedPredicate.id);
  };

  vm.usePredicate = () => {
    $uibModalInstance.close(vm.selectedPredicate);
  };

  vm.createAndUsePredicate = () => {
    return predicateService.createPredicate(vm.selectedPredicate)
      .then(vm.usePredicate, err => vm.submitError = true);
  };

  vm.createNew = (selectionOwlType) => {
    return searchConceptModal.openNewCreation(references, 'predicate').result
      .then(result => {
        if (!vm.typeSelectable) {
          $uibModalInstance.close(_.extend(result, {type: selectionOwlType}));
        } else {
          predicateService.newPredicate(vm.model, result.label, result.concept.id, selectionOwlType, languageService.getModelLanguage())
            .then(predicate => {
              vm.selectedPredicate = predicate;
              $scope.formController.editing = true;
            });
        }
      });
  };

  vm.isEditing = () => {
    return $scope.formController && $scope.formController.editing;
  };

  vm.isAttributeAddable = () => {
    return vm.typeSelectable || vm.type === 'attribute';
  };

  vm.isAssociationAddable = () => {
    return vm.typeSelectable || vm.type === 'association';
  };

  function localizedLabelAsLower(predicate) {
    return languageService.translate(predicate.label).toLowerCase();
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
