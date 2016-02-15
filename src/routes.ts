import IRouteProvider = angular.route.IRouteProvider;
import IRouteService = angular.route.IRouteService;
import { Uri } from './services/entities';
import IScope = angular.IScope;

export function routeConfig($routeProvider: IRouteProvider) {
  'ngInject';

  $routeProvider
    .when('/', {
      template: '<front-page></front-page>',
    })
    .when('/user', {
      template: '<user></user>',
    })
    .when('/group', {
      template: '<group group-id="groupId"></group>',
      controller($scope: any, groupId: Uri) {
        $scope.groupId = groupId;
      },
      resolve: {
        groupId($route: IRouteService) {
          return $route.current.params.urn;
        }
      }
    })
    .when('/model', {
      template: '<model></model>',
      reloadOnSearch: false
    });
};
