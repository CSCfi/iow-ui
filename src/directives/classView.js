module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      class: '=activeClass',
      context: '=context'
    },
    template: require('./templates/classView.html'),
    controller($scope, $modal, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;

      $scope.addProperty = () => {
        const modal = $modal.open({
          template: require('./templates/addProperty.html')
        });
      };
    }
  };
};
