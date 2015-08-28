const angular = require('angular');

require('angular-cookies');
require('angular-gettext');
require('./vendor/angular-xeditable-0.1.8/js/xeditable');

require('./restapi/restapi');

angular.module('myApp', [
  require('angular-route'),
  require('angular-ui-bootstrap'),
  'ngCookies',
  'gettext',
  'xeditable',
  require('./groups')
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
