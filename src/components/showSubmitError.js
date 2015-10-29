module.exports = function directive() {
  'ngInject';

  return {
    scope: {},
    restrict: 'E',
    template: require('./templates/showSubmitError.html'),
    require: '^editableForm',
    link(scope, element, attributes, editableFormController) {
      scope.formController = editableFormController;
    }
  };
};
