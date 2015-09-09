module.exports = function /* @ngInject */ classView($log) {
  return {
    scope: {
      attribute: '='
    },
    template: require('./templates/attributeView.html'),
    controller($scope) {

    }
  };
};
