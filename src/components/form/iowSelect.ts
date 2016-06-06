import IAttributes = angular.IAttributes;
import IDocumentService = angular.IDocumentService;
import INgModelController = angular.INgModelController;
import IParseService = angular.IParseService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IRepeatScope = angular.IRepeatScope;
import IScope = angular.IScope;
import ITranscludeFunction = angular.ITranscludeFunction;
import { isDefined } from '../../utils/object';
import { esc, tab, enter, pageUp, pageDown, arrowUp, arrowDown } from '../../utils/keyCode';
import { scrollToElement } from '../../utils/angular';
import { module as mod }  from './module';

mod.directive('iowSelect', () => {
  return {
    restrict: 'E',
    scope: {
      ngModel: '=',
      options: '@'
    },
    transclude: true,
    bindToController: true,
    template: `
      <div>
        <div class="form-control" tabindex="0" iow-select-input>
          <iow-selection-transclude></iow-selection-transclude>       
          <i class="caret" ng-hide="ctrl.show"></i>
        </div>
        <div ng-if="ctrl.show" ng-class="{open: ctrl.show}" style="position: relative">
          <ul class="dropdown-menu" ng-show="ctrl.show" style="width: 100%">
            <li ng-repeat="item in ctrl.items"
                class="ng-animate-disabled"
                ng-class="{ active: ctrl.isSelected($index) }" 
                ng-mouseenter="ctrl.setSelection($index)" 
                ng-mousedown="ctrl.selectSelection(event)"
                iow-select-item>
              <a href=""><iow-selectable-item-transclude></iow-selectable-item-transclude></a>
            </li>
          </ul>
        </div>
      </div>
    `,
    controller: IowSelectController,
    controllerAs: 'ctrl'
  };
});

function parse(exp: string) {
  const match = exp.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)$/);

  if (!match) {
    throw new Error(`Expected expression in form of '_item_ in _collection_' but got '${exp}'.`);
  }

  if (!match[1].match(/^(?:(\s*[$\w]+))$/)) {
    throw new Error(`'_item_' in '_item_ in _collection_' should be an identifier expression, but got '${match[1]}'.`);
  }

  return {
    itemName: match[1],
    collection: match[2]
  };
};

interface SelectionScope extends IScope {
  ctrl: IowSelectController<any>;
}

export class IowSelectController<T> {

  options: string;
  ngModel: T;

  itemName: string;
  items: T[];

  show: boolean;
  selectedSelectionIndex = -1;

  /* @ngInject */
  constructor($q: IQService, $scope: SelectionScope, $parse: IParseService) {

    $scope.$watch(() => this.options, optionsExp => {
      const result = parse(optionsExp);

      this.itemName = result.itemName;
      $q.when($parse(result.collection)($scope.$parent)).then(items => this.items = items);
    });
  }

  private openIfNotShown(action: () => void) {
    if (!this.show) {
      this.open();
    } else {
      action();
    }
  }

  private keyEventHandlers: {[key: number]: () => void|boolean} = {
    [arrowDown]: () => this.openIfNotShown(() => this.moveSelection(1)),
    [arrowUp]: () => this.openIfNotShown(() => this.moveSelection(-1)),
    [pageDown]: () => this.openIfNotShown(() => this.moveSelection(10)),
    [pageUp]: () => this.openIfNotShown(() => this.moveSelection(-10)),
    [enter]: () => this.openIfNotShown(() => this.selectSelection()),
    [tab]: () => {
      this.selectSelection();
      return false;
    },
    [esc]: () => this.close()
  };

  keyPressed(event: JQueryEventObject) {
    const handler = this.keyEventHandlers[event.keyCode];
    if (handler) {
      const preventDefault = handler();
      if (!isDefined(preventDefault) || preventDefault === true) {
        event.preventDefault();
      }
    }
  }

  private moveSelection(offset: number) {
    this.setSelection(Math.max(Math.min(this.selectedSelectionIndex + offset, this.items.length - 1), -1));
  }

  private setSelection(index: number) {
    this.selectedSelectionIndex = index;
  }

  isSelected(index: number) {
    return index === this.selectedSelectionIndex;
  }

  toggleOpen() {
    if (this.show) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.show = true;
    this.selectedSelectionIndex = this.findSelectionIndex();
  }

  close() {
    this.show = false;
    this.selectedSelectionIndex = -1;
  }

  selectSelection(event?: JQueryEventObject) {

    if (event) {
      event.preventDefault();
    }

    if (this.selectedSelectionIndex >= 0) {
      const newSelection = this.items[this.selectedSelectionIndex];
      this.ngModel = newSelection;
    }

    this.close();
  }

  private findSelectionIndex() {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      if (item === this.ngModel) {
        return i;
      }
    }

    return -1;
  }
}

mod.directive('iowSelectInput', /* @ngInject */ ($document: IDocumentService) => {
  return {
    restrict: 'A',
    require: '^iowSelect',
    link($scope: SelectionScope, element: JQuery, attributes: IAttributes, controller: IowSelectController<any>) {

      const iowSelectElement = element.closest('iow-select');

      const keyDownHandler = (event: JQueryEventObject) => $scope.$apply(() => controller.keyPressed(event));
      const clickHandler = (event: JQueryEventObject) => $scope.$apply(() => controller.toggleOpen());
      const focusHandler = () => $document.on('click', blurClickHandler);
      const blurClickHandler = (event: JQueryEventObject) => {

        const eventIowSelectElement = angular.element(event.target).closest('iow-select');

        if (eventIowSelectElement[0] !== iowSelectElement[0]) {
          $scope.$apply(() => controller.close());
          $document.off('click', blurClickHandler);
        }
      };

      element.on('click', clickHandler);
      element.on('keydown', keyDownHandler);
      element.on('focus', focusHandler);

      $scope.$on('destroy', () => {
        element.off('click', clickHandler);
        element.off('keydown', keyDownHandler);
        element.off('focus', focusHandler);
      });
    }
  };
});

mod.directive('iowSelectItem', () => {
  return {
    restrict: 'A',
    require: '^iowSelect',
    link($scope: IRepeatScope, element: JQuery, attributes: IAttributes, controller: IowSelectController<any>) {
      $scope.$watch(() => controller.selectedSelectionIndex, index => {
        if ($scope.$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
});

mod.directive('iowSelectionTransclude', () => {
  return {
    require: '^iowSelect',
    link($scope: SelectionScope, element: JQuery, attribute: IAttributes, controller: IowSelectController<any>, transclude: ITranscludeFunction) {

      let childScope: IScope;

      $scope.$watch(() => $scope.ctrl.ngModel, item => {
        if (!childScope) {
          transclude((clone, transclusionScope) => {
            childScope = transclusionScope;
            transclusionScope[controller.itemName] = item;
            element.append(clone);
          });
        } else {
          childScope[controller.itemName] = item;
        }
      });
    }
  };
});

interface SelectItemScope extends IRepeatScope {
  item: any;
}

mod.directive('iowSelectableItemTransclude', () => {
  return {
    require: '^iowSelect',
    link($scope: SelectItemScope, element: JQuery, attribute: IAttributes, controller: IowSelectController<any>, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope[controller.itemName] = $scope.item;
        element.append(clone);
      });
    }
  };
});
