const _ = require('lodash');

const contextUtils = require('../services/contextUtils');
const constants = require('./constants');

module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      id: '='
    },
    restrict: 'E',
    template: require('./templates/associationView.html'),
    require: '^ngController',
    bindToController: true,
    controllerAs: 'ctrl',
    link($scope, element, attributes, modelController) {
      const controller = $scope.ctrl;
      modelController.registerView(controller);
      $scope.modelController = modelController;
      $scope.formController = element.find('editable-form').controller('editableForm');
    },
    controller($scope, predicateService) {
      'ngInject';

      let context;
      let originalId;

      $scope.attributeValues = constants.attributeValues;

      $scope.$watch('ctrl.id', id => {
        predicateService.getPredicateById(id, 'associationFrame').then(data => {
          $scope.association = data['@graph'][0];
          context = data['@context'];
          originalId = id;
        });
      });

      $scope.updateAssociation = () => {
        const ld = _.chain($scope.association)
          .clone()
          .assign({'@context': context})
          .value();

        const id = contextUtils.withFullIRI(context, $scope.association['@id']);

        $log.info(JSON.stringify(ld, null, 2));

        return predicateService.updatePredicate(ld, id, originalId).then(() => {
          originalId = id;
          $scope.id = id;
          $scope.modelController.reload();
        });
      };

      return {
        isEditing() {
          $scope.formController.visible();
        }
      };
    }
  };
};
