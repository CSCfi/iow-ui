module.exports = function idInputDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      plainText: '='
    },
    restrict: 'E',
    template: require('./formId.html'),
    controllerAs: 'inputController',
    bindToController: true,
    require: '^editableForm',
    link(scope, element, attributes, editableFormController) {
      scope.formController = editableFormController;
    },
    controller($scope) {
      'ngInject';
      $scope.$watch('inputController.plainText', value => {
        if(value) {
          this.id = value.split(':')[1];
        }
      });

      this.update = value => {
        this.plainText = this.plainText.split(':')[0] + ':' + this.id;
      };
    }
  };
};
