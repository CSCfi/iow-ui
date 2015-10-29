const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function modalFactory($uibModal, modelLanguage) {
  'ngInject';

  return {
    open(confirmButtonText = 'Käytä ominaisuutta') {
      return $uibModal.open({
        template: require('./templates/searchPredicateModal.html'),
        size: 'large',
        controller: SearchPredicateController,
        controllerAs: 'ctrl',
        resolve: {
          confirmButtonText: () => modelLanguage.translate(confirmButtonText)
        }
      });
    }
  };
};

function SearchPredicateController($modalInstance, predicateService, modelLanguage, confirmButtonText) {
  'ngInject';

  const vm = this;
  let context;
  let predicates;

  vm.confirmButtonText = confirmButtonText;
  vm.close = $modalInstance.dismiss;
  vm.selectedPredicate = null;
  vm.searchText = '';
  vm.modelId = '';
  vm.models = [];
  vm.type = '';
  vm.types = [];

  predicateService.getAllPredicates().then(result => {
    predicates = result['@graph'];

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
    predicateService.getPredicateById(predicate['@id'], 'predicateFrame').then(result => {
      context = result['@context'];
      vm.selectedPredicate = result['@graph'][0];
    });
  };

  vm.isSelected = (predicate) => {
    return predicate['@id'] === selectedPredicateId();
  };

  vm.confirm = () => {
    $modalInstance.close(selectedPredicateId());
  };

  vm.iconClass = (predicate) => {
    return ['glyphicon',
      {
        'glyphicon-list-alt': predicate['@type'] === 'owl:ObjectProperty',
        'glyphicon-tasks': predicate['@type'] === 'owl:DatatypeProperty'
      }];
  };

  function selectedPredicateId() {
    return vm.selectedPredicate && contextUtils.withFullIRI(context, vm.selectedPredicate['@id']);
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
