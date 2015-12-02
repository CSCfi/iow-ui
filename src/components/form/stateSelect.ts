import IScope = angular.IScope;
import { UserService } from '../../services/userService';
import { Model, State, states } from '../../services/entities';

export const mod = angular.module('iow.components.form');

const userStates = [states.unstable, states.draft];
const adminStates = userStates.concat([states.recommendation, states.deprecated]);

mod.directive('stateSelect', () => {
  'ngInject';
  return {
    scope: {
      state: '=',
      model: '=',
      id: '@'
    },
    restrict: 'E',
    template: '<value-select id="{{ctrl.id}}" values="ctrl.getStates()" value="ctrl.state"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller(userService: UserService) {
      this.getStates = () => userService.user.isAdminOf(this.model) ? adminStates : userStates;
    }
  };
});
