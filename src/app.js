const angular = require('angular');

require('angular-gettext');
require('./vendor/angular-xeditable-0.1.8/js/xeditable');

angular.module('myApp', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'gettext',
  'xeditable',
  require('./groups'),
  require('./restapi')
])
.config(function mainConfig($routeProvider) {
  $routeProvider
    .when('/', {
      template: require('./main/_index.html')
    });
})
.run(function onAppRun(editableOptions) {
  editableOptions.theme = 'bs3';
})
.controller('AppCtrl', function mainAppCtrl($scope, $location) {

});
