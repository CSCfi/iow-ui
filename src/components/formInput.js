module.exports = function formInputDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      content: '='
    },
    restrict: 'E',
    template: require('./templates/formInput.html'),
    controllerAs: 'inputController',
    bindToController: true,
    require: '^editableForm',
    link(scope, element, attributes, editableFormController) {
      scope.formController = editableFormController;
    },
    controller(modelLanguage) {
      'ngInject';

      const vm = this;

      vm.getLanguage = modelLanguage.getLanguage;
      vm.hasContentForLanguage = hasContentForLanguage;

      function hasContentForLanguage() {
        return this.content && this.content[this.getLanguage()];
      }
    }
  };
};
