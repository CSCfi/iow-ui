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
    template: `
      <iow-select id="{{ctrl.id}}" options="state in ctrl.getStates()" ng-model="ctrl.state">
        <i ng-class="ctrl.classForState(state)"></i>
        <span>{{state | translate}}</span>
      </iow-select>
    `,
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

  classForState(state: State) {
    switch (state) {
      case 'Unstable':
      case 'Deprecated':
        return ['fa', 'fa-exclamation-circle', 'danger'];
      case 'Draft':
        return ['fa', 'fa-exclamation-circle', 'warning'];
      case 'Recommendation':
        return ['fa', 'fa-check-circle', 'success'];
      default:
        throw new Error('Unsupported state: ' + state);
    }
  }
}
