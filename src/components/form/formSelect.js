module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      ngModel: '=',
      values: '='
    },
    restrict: 'E',
    template: require('./formSelect.html'),
    require: '^form',
    link($scope, element, attributes, formController) {
      $scope.formController = formController;
    },
    controller($scope, gettextCatalog) {
      'ngInject';
      $scope.displayName = (text) => text && `${gettextCatalog.getString(text)} (${text})`;
      $scope.hasContent = () => $scope.ngModel;
    }
  };
};
