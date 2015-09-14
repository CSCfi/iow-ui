module.exports = function /* @ngInject */ associationView($log) {
  return {
    scope: {
      association: '='
    },
    template: require('./templates/associationView.html'),
    controller($scope) {

    }
  };
};
