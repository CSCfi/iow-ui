import { module as mod } from './module';
import { Coordinate } from '../../entities/contract';
import { IScope } from 'angular';
import { Optional } from '../../utils/object';
import { VisualizationClass } from '../../entities/visualization';
import { Model } from '../../entities/model';
import { ClassService } from '../../services/classService';
import { ModelPageActions } from '../model/modelPage';

export interface ContextMenuTarget {
  coordinate: Coordinate;
  target: VisualizationClass;
}

mod.directive('visualizationContextMenu', () => {
  return {
    scope: {
      model: '=',
      modelPageActions: '=',
      target: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
      <ul class="dropdown-menu" role="menu" ng-style="ctrl.style" ng-if="ctrl.actions.length > 0">
        <li role="menuitem" ng-repeat="action in ctrl.actions"><a ng-click="ctrl.invokeAction(action)">{{action.name | translate}}</a></li>
      </ul>
    `,
    controller: VisualizationContextMenuController
  };
});

interface Action {
  name: string;
  invoke: () => void;
}

class VisualizationContextMenuController {

  model: Model;
  modelPageActions: ModelPageActions;
  target: Optional<ContextMenuTarget>;
  actions: Action[] = [];
  style: any;

  constructor($scope: IScope, private classService: ClassService) {
    $scope.$watch(() => this.target, target => {
      if (target) {

        this.style = {
          left: target.coordinate.x,
          top: target.coordinate.y
        };

        this.actions = [];

        if (!target.target.resolved) {
          if (this.model.isOfType('library')) {
            this.actions.push({ name: 'Assign class to library', invoke: () => this.assignClassToModel() });
          } else {
            this.actions.push({ name: 'Specialize class to profile', invoke: () => this.specializeClass() });
          }
        }
      }
    });
  }

  assignClassToModel() {
    this.classService.getClass(this.target!.target.id, this.model)
      .then(klass => this.modelPageActions.assignClassToModel(klass));
  }

  specializeClass() {
    this.classService.getInternalOrExternalClass(this.target!.target.id, this.model)
      .then(klass => this.modelPageActions.createShape(klass, klass.external));
  }

  dismiss() {
    this.target = null;
    this.actions = [];
  }

  invokeAction(action: Action) {
    action.invoke();
    this.dismiss();
  }
}
