import {UserService} from '../../services/userService';
import IScope = angular.IScope;

export const mod = angular.module('iow.components.form');

const states = ['Unstable', 'Draft'];
const adminStates = ['Recommendation', 'Deprecated'];

mod.directive('stateSelect', () => {
  'ngInject';
  return {
    scope: {
      state: '=',
      model: '='
    },
    restrict: 'E',
    template: '<value-select name="State" values="ctrl.states" value="ctrl.state"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller($scope: IScope, userService: UserService) {
      'ngInject';

      $scope.$watch(() => userService.user, () => {
        const group = this.model.graph.isPartOf['@id'];
        const user = userService.user;

        if (user.isAdminOfGroup(group)) {
          this.states = states.concat(adminStates);
        }
        else {
          this.states = states;
        }
      });
    }
  };
});
