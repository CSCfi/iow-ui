module.exports = function formInputDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      titleEditOnly: '@',
      content: '=',
      plainText: '='
    },
    restrict: 'E',
    template: require('./formInput.html'),
    controllerAs: 'inputController',
    bindToController: true,
    require: '^editableForm',
    link(scope, element, attributes, editableFormController) {
      scope.formController = editableFormController;
    },
    controller(languageService) {
      'ngInject';

      const vm = this;
      vm.getLanguage = languageService.getModelLanguage;
      vm.hasContent = () => vm.plainText || (vm.content && vm.content[languageService.getModelLanguage()]);
    }
  };
};
