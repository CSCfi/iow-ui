import IRouteProvider = angular.route.IRouteProvider;
import IRouteService = angular.route.IRouteService;
import IScope = angular.IScope;
import { Uri } from './services/uri';
import { Type } from './services/entities';

/* @ngInject */
export function routeConfig($routeProvider: IRouteProvider) {
  $routeProvider
    .when('/', {
      template: '<front-page></front-page>'
    })
    .when('/user', {
      template: '<user></user>'
    })
    .when('/group', {
      template: '<group group-id="groupId"></group>',
      controller($scope: any, $route: IRouteService) {
        $scope.groupId = new Uri($route.current.params.urn, {});
      }
    })
    .when('/newModel', {
      template: '<new-model prefix="prefix" label="label" group="group" languages="languages" type="type"></new-model>',
      controller($scope: any, $route: IRouteService) {
        const params: any = $route.current.params;

        $scope.prefix = params.prefix;
        $scope.label = params.label;
        $scope.group = new Uri(params.group, {});
        $scope.languages = $route.current.params.language;
        $scope.type = params.type;
      }
    })
    .when('/model', {
      template: '<model></model>',
      reloadOnSearch: false
    });
};
