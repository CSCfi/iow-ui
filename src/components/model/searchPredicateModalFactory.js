const _ = require('lodash');
const graphUtils = require('../../services/graphUtils');
const utils = require('../../services/utils');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  function openModal(vocabularies, type, excludedPredicateMap, model) {
    return $uibModal.open({
      template: require('./searchPredicateModal.html'),
      size: 'large',
      controller: SearchPredicateController,
      controllerAs: 'ctrl',
      resolve: {
        vocabularies: () => vocabularies,
        type: () => type,
        excludedPredicateMap: () => excludedPredicateMap,
        model: () => model
      }
    });
  }

  return {
    open(vocabularies, type, excludedPredicateMap) {
      return openModal(vocabularies, type, excludedPredicateMap, null);
    },
    openWithPredicationCreation(model) {
      return openModal(graphUtils.graph(model).references, null, {}, model);
    }
  };
};

function SearchPredicateController($scope, $uibModalInstance, $timeout, vocabularies, type, excludedPredicateMap, model, predicateService, modelLanguage, searchConceptModal) {
  'ngInject';

  const vm = this;
  let predicates;

  $timeout(() => {
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

  predicateService.getAllPredicates().then(result => {
    predicates = _.reject(result['@graph'], predicate => excludedPredicateMap[predicate['@id']]);

    vm.models = _.chain(predicates)
      .map(predicate => predicate.isDefinedBy)
      .uniq(db => db['@id'])
      .value();

    vm.types = _.chain(predicates)
      .map(predicate => predicate['@type'])
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
    predicateService.getPredicate(predicate['@id']).then(result => vm.selectedPredicate = result);
  };

  vm.isSelected = (predicate) => {
    return predicate['@id'] === selectedPredicateId();
  };

  vm.usePredicate = () => {
    $uibModalInstance.close(selectedPredicateId());
  };

  vm.createAndUsePredicate = () => {
    return predicateService.createPredicate(vm.selectedPredicate, graphUtils.withFullId(vm.selectedPredicate)).then(vm.usePredicate);
  };

  vm.createNew = (selectionType) => {
    return searchConceptModal.open(vocabularies, 'Define concept for the new predicate').result
      .then(result => {
        if (!vm.typeSelectable) {
          $uibModalInstance.close(_.extend(result, {type: selectionType}));
        } else {
          predicateService.getPredicateTemplate(model['@context'], graphUtils.withFullId(model), result.label, result.conceptId, selectionType, modelLanguage.getLanguage())
            .then(predicate => {
              vm.selectedPredicate = predicate;
              $scope.editableFormController.show();
            });
        }
      });
  };

  vm.iconClass = (predicate) => {
    return utils.glyphIconClassForType(graphUtils.asTypeString(predicate['@type']));
  };

  function selectedPredicateId() {
    return graphUtils.withFullId(vm.selectedPredicate);
  }

  function localizedLabelAsLower(predicate) {
    return modelLanguage.translate(predicate.label).toLowerCase();
  }

  function textFilter(predicate) {
    return !vm.searchText || localizedLabelAsLower(predicate).includes(vm.searchText.toLowerCase());
  }

  function modelFilter(predicate) {
    return !vm.modelId || predicate.isDefinedBy['@id'] === vm.modelId;
  }

  function typeFilter(predicate) {
    return !vm.type || predicate['@type'] === vm.type;
  }
}
