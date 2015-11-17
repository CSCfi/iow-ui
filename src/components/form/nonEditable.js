module.exports = function editableDirective() {
  'ngInject';
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      linkNewWindow: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: `<div ng-show="value">
                 <div class="model-view__title">{{title | translate}}</div>
                 <a ng-if="link" ng-href="{{link}}">{{displayValue()}}</a>
                 <a ng-if="linkNewWindow" ng-href="{{linkNewWindow}}" target="_blank">{{displayValue()}}</a>
                 <div ng-if="!link && !linkNewWindow">{{displayValue()}}</div>
               </div>`,
    controller($scope, languageService, gettextCatalog) {
      'ngInject';

      $scope.displayValue = () => {
        const value = $scope.value;
        if (value) {
          return typeof value === 'object' ? languageService.translate(value) : $scope.valueAsLocalizationKey ? gettextCatalog.getString(value) : value;
        }
      };
    }
  };
};
