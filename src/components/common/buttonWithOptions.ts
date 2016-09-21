import { module as mod } from './module';

mod.directive('buttonWithOptions', () => {
  return {
    restrict: 'E',
    scope: {
      iconClass: '@',
      options: '=',
      disabled: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: ButtonWithOptionsController,
    template: `                
        <div ng-if="ctrl.options.length > 1" class="btn-group pull-right" uib-dropdown>
          <button type="button" 
                  class="btn btn-default additional"
                  ng-disabled="ctrl.disabled"
                  uib-dropdown-toggle><span class="caret"></span></button>
          <ul class="dropdown-menu" role="menu">
            <li role="menuitem" ng-repeat="option in ctrl.options"><a ng-click="option.apply()">{{option.name | translate}}</a></li>
          </ul>
        </div>
        
        <button type="button"
                class="btn btn-default pull-right"
                ng-disabled="ctrl.disabled"
                ng-click="ctrl.options[0].apply()" uib-tooltip="{{ctrl.options[0].name | translate}}"><i ng-class="ctrl.iconClass"></i></button>
    `
  };
});

export interface Option {
  name: string;
  apply: () => void;
}

class ButtonWithOptionsController {

  iconClass: string;
  options: Option[];
  disabled: boolean;

  constructor() {
    if (!this.options || this.options.length === 0) {
      throw new Error('Empty options');
    }
  }
}
