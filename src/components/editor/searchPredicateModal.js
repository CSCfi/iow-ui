const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  function openModal(references, type, excludedPredicateMap, model) {
    return $uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'large',
      controller: SearchPredicateController,
      controllerAs: 'ctrl',
      backdrop: false,
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
      return openModal(references, type, excludedPredicateMap);
    },
    openWithPredicationCreation(model) {
      return openModal(model.references, null, {}, model);
    }
  };
};

function SearchPredicateController($scope, $uibModalInstance, references, type, excludedPredicateMap, model, predicateService, languageService, searchConceptModal) {
  'ngInject';

  const vm = this;
  let predicates;

  vm.close = $uibModalInstance.dismiss;
  vm.selectedPredicate = null;
  vm.selectedItem = null;
  vm.searchText = '';
  vm.modelId = '';
  vm.models = [];
  vm.type = type;
  vm.types = [];
  vm.typeSelectable = !type;
  vm.references = references;

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
    $scope.form.editing = false;
    $scope.form.submitError = false;
    vm.selectedItem = predicate;
    predicateService.getPredicate(predicate.id).then(result => vm.selectedPredicate = result);
  };

  vm.isSelected = (predicate) => {
    return predicate === vm.selectedItem;
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
          predicateService.newPredicate(model, result.label, result.concept.id, selectionOwlType, languageService.getModelLanguage())
            .then(predicate => {
              vm.selectedPredicate = predicate;
              $scope.form.editing = true;
            });
        }
      });
  };

  vm.isEditing = () => {
    return $scope.form && $scope.form.editing;
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
