module.exports = function localizedInputDirective(languageService) {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope, element, attributes, modelController) {
      let localized;

      $scope.$watch(languageService.getModelLanguage, lang => {
        element.val(localized[lang]);
      });

      modelController.$parsers.push(viewValue => {
        localized = Object.assign(localized, {
          [languageService.getModelLanguage()]: viewValue
        });
        return localized;
      });

      modelController.$formatters.push(modelValue => {
        localized = modelValue || {};
        return localized[languageService.getModelLanguage()];
      });
    }
  };
};
