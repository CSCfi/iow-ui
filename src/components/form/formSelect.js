module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      content: '=',
      values: '='
    },
    restrict: 'E',
    template: require('./formSelect.html'),
    controllerAs: 'inputController',
    bindToController: true,
    require: '^editableForm',
    link(scope, element, attributes, editableFormController) {
      scope.formController = editableFormController;
    },
    controller(gettextCatalog) {
      'ngInject';

      const vm = this;

      vm.displayName = (text) => `${gettextCatalog.getString(text)} (${text})`;
    }
  };
};
