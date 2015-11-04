const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(type, excludedPredicateMap = {}) {
      return $uibModal.open({
        template: require('./templates/searchPredicateModal.html'),
        size: 'large',
        controller: SearchPredicateController,
        controllerAs: 'ctrl',
        resolve: {
          type: () => type,
          excludedPredicateMap: () => excludedPredicateMap
        }
      });
    }
  };
};

function SearchPredicateController($uibModalInstance, type, excludedPredicateMap, predicateService, modelLanguage, searchConceptModal) {
  'ngInject';

  const vm = this;
  let context;
  let predicates;

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
    predicateService.getPredicateById(predicate['@id']).then(result => {
      context = result['@context'];
      vm.selectedPredicate = result['@graph'][0];
    });
  };

  vm.isSelected = (predicate) => {
    return predicate['@id'] === selectedPredicateId();
  };

  vm.confirm = () => {
    $uibModalInstance.close(selectedPredicateId());
  };

  vm.createNew = (selectionType) => {
    return searchConceptModal.open('Define concept for the new predicate').result.then(result => {
      $uibModalInstance.close(_.extend(result, {type: selectionType}));
    });
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
