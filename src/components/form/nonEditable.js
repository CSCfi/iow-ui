module.exports = function editableDirective() {
  'ngInject';
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      externalLink: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: `<div ng-show="value">
                 <div class="model-view__title">{{title | translate}}</div>
                 <a ng-if="link && isDifferentUrl(link)" ng-href="{{link}}">{{displayValue()}}</a>
                 <a ng-if="externalLink" ng-href="{{externalLink}}" target="_blank">{{displayValue()}}</a>
                 <div ng-if="(!link || !isDifferentUrl(link)) && !externalLink">{{displayValue()}}</div>
               </div>`,
    controller($scope, $location, languageService, gettextCatalog) {
      'ngInject';

      $scope.isDifferentUrl = url => {
        const location = '#' + $location.url().replace(/:/g, '%3A');
        return location !== url;
      };

      $scope.displayValue = () => {
        const value = $scope.value;
        if (value) {
          return typeof value === 'object' ? languageService.translate(value) : $scope.valueAsLocalizationKey ? gettextCatalog.getString(value) : value;
        }
      };
    }
  };
};
