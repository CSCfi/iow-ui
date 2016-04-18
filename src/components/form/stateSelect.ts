import IScope = angular.IScope;
import { UserService } from '../../services/userService';
import { State, Model } from '../../services/entities';

import { module as mod }  from './module';

const userStates: State[] = ['Unstable', 'Draft'];
const adminStates: State[] = userStates.concat(['Recommendation', 'Deprecated']);

mod.directive('stateSelect', () => {
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
    controller: StateSelectController
  };
});

class StateSelectController {

  model: Model;
  state: State;
  id: string;

  /* @ngInject */
  constructor(private userService: UserService) {
  }

  getStates() {
    return this.userService.user.isAdminOf(this.model) ? adminStates : userStates;
  }
}
