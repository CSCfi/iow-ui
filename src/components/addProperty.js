const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function addPropertyDirective() {
  return {
    scope: {},
    restrict: 'E',
    template: '<button type="button" class="btn btn-default add-property-button" ng-click="ctrl.addProperty()" ng-if="ctrl.canAddProperty()" translate>Add property</button>',
    controllerAs: 'ctrl',
    require: '^classView',
    link($scope, element, attribute, classViewController) {
      $scope.ctrl.classViewController = classViewController;
    },
    controller($uibModal, userService) {
      'ngInject';

      const vm = this;

      vm.addProperty = () => {
        $uibModal.open({
          template: require('./templates/addProperty.html'),
          size: 'large',
          controller: AddPropertyController,
          controllerAs: 'ctrl',
          bindToController: true
        }).result.then((result) => vm.classViewController.addPropertyByPredicateId(result));
      };

      vm.canAddProperty = () => userService.isLoggedIn() && vm.classViewController.isEditing();
    }
  };
};

function AddPropertyController($modalInstance, predicateService, modelLanguage) {
  'ngInject';

  const vm = this;
  let context;
  let predicates;

  vm.close = $modalInstance.dismiss;
  vm.selectedPredicate = null;
  vm.searchText = '';

  predicateService.getAllPredicates().then(result => predicates = result['@graph']);

  vm.searchResults = () => {
    return _.chain(predicates)
      .filter(textFilter)
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

  vm.addProperty = () => {
    $modalInstance.close(selectedPredicateId());
  };

  vm.iconClass = (predicate) => {
    return ['glyphicon',
      {
        'glyphicon-random': predicate['@type'] === 'owl:ObjectProperty',
        'glyphicon-pencil': predicate['@type'] === 'owl:DatatypeProperty'
      }];
  };

  function selectedPredicateId() {
    return vm.selectedPredicate && contextUtils.withFullIRI(context, vm.selectedPredicate['@id']);
  }

  function localizedLabelAsLower(predicate) {
    return modelLanguage.translate(predicate.label).toLowerCase();
  }

  function textFilter(predicate) {
    return vm.searchText ? localizedLabelAsLower(predicate).includes(vm.searchText.toLowerCase()) : true;
  }
}
