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

function AddPropertyController($modalInstance, searchService, predicateService) {
  'ngInject';

  const vm = this;
  vm.close = $modalInstance.dismiss;
  vm.searchResults = null;
  vm.selectedPredicate = null;
  vm.searchText = '';

  let context;

  vm.search = () => {
    if (vm.searchText) {
      searchService.searchPredicates(vm.searchText).then(result => {
        vm.searchResults = _.groupBy(result, item => item['@type']);
      });
    } else {
      vm.searchResults = null;
    }
  };
  vm.selectPredicate = (predicate) => {
    predicateService.getPredicateById(predicate['@id'], 'predicateFrame').then(result => {
      context = result['@context'];
      vm.selectedPredicate = result['@graph'][0];
    });
  };
  vm.addProperty = () => {
    $modalInstance.close(contextUtils.withFullIRI(context, vm.selectedPredicate['@id']));
  };
}
