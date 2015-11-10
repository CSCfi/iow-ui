module.exports = function formTextAreaDirective($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      content: '=',
      plainText: '='
    },
    restrict: 'E',
    template: require('./formTextArea.html'),
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
