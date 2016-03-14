import IScope = angular.IScope;
import { UserService } from '../../services/userService';
import { State } from '../../services/entities';

export const mod = angular.module('iow.components.form');

const userStates: State[] = ['Unstable', 'Draft'];
const adminStates: State[] = userStates.concat(['Recommendation', 'Deprecated']);

mod.directive('stateSelect', () => {
  'ngInject';
  return {
    scope: {
      state: '=',
      model: '=',
      id: '@'
    },
    restrict: 'E',
    template: '<localized-select id="{{ctrl.id}}" values="ctrl.getStates()" value="ctrl.state"></localized-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller(userService: UserService) {
      this.getStates = () => userService.user.isAdminOf(this.model) ? adminStates : userStates;
    }
  };
});
