import IScope = angular.IScope;
import { UserService } from '../../services/userService';
import { Model, State } from '../../services/entities';

export const mod = angular.module('iow.components.form');

const states = ['Unstable', 'Draft'];
const adminStates = states.concat(['Recommendation', 'Deprecated']);

mod.directive('stateSelect', () => {
  'ngInject';
  return {
    scope: {
      state: '=',
      model: '='
    },
    restrict: 'E',
    template: '<value-select name="State" values="ctrl.getStates()" value="ctrl.state"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller(userService: UserService) {
      this.getStates = () => userService.user.isAdminOf(this.model) ? adminStates : states;
    }
  };
});
