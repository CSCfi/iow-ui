import IAttributes = angular.IAttributes;
import IScope = angular.IScope;

import { module as mod }  from './module';
import { keyCodes } from '../../services/utils';

mod.directive('keyControl', () => {
  return {
    restrict: 'A',
    controllerAs: 'keyControl',
    require: 'keyControl',
    link($scope: IScope, element: JQuery, attributes: IAttributes, controller: KeyControlController) {
      element.on('keydown', event => controller.keyPressed(event));
      $scope.$watch(element.attr('key-control') + '.length', (items: number) => controller.onItemsChange(items || 0));
    },
    controller: KeyControlController
  };
});

export class KeyControlController {

  itemCount: number = 0;
  selectionIndex: number = -1;

  private keyEventHandlers: {[key: number]: () => void} = {
    [keyCodes.arrowDown]: () => this.moveSelection(1),
    [keyCodes.arrowUp]: () => this.moveSelection(-1),
    [keyCodes.pageDown]: () => this.moveSelection(10),
    [keyCodes.pageUp]: () => this.moveSelection(-10),
    [keyCodes.enter]: () => this.selectSelection()
  };

  constructor(private $scope: IScope) {
  }

  onItemsChange(itemCount: number) {
    this.itemCount = itemCount;
    this.setSelection(-1);
  }

  keyPressed(event: JQueryEventObject) {
    const handler = this.keyEventHandlers[event.keyCode];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  private moveSelection(offset: number) {
    this.setSelection(Math.max(Math.min(this.selectionIndex + offset, this.itemCount - 1), -1));
  }

  private setSelection(index: number) {
    this.selectionIndex = index;
    this.$scope.$broadcast('selectionMoved', this.selectionIndex);
  }

  private selectSelection() {
    this.$scope.$broadcast('selectionSelected', this.selectionIndex);
  }
}


