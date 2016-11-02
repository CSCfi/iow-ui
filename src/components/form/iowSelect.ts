import { IAttributes, IDocumentService, IParseService, IQService, IScope, ITranscludeFunction } from 'angular';
import { isDefined } from '../../utils/object';
import { esc, tab, enter, pageUp, pageDown, arrowUp, arrowDown } from '../../utils/keyCode';
import { module as mod }  from './module';
import { InputWithPopupController } from './inputPopup';

// TODO: similarities with autocomplete
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
        <input-popup ctrl="ctrl"><iow-selectable-item-transclude></iow-selectable-item-transclude></input-popup>
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
}

interface SelectionScope extends IScope {
  ctrl: IowSelectController<any>;
}

export class IowSelectController<T> implements InputWithPopupController<T> {

  options: string;
  ngModel: T;

  popupItemName: string;
  popupItems: T[];

  show: boolean;
  selectedSelectionIndex = -1;

  element: JQuery;

  /* @ngInject */
  constructor($q: IQService, $scope: SelectionScope, $parse: IParseService) {

    $scope.$watch(() => this.options, optionsExp => {
      const result = parse(optionsExp);

      this.popupItemName = result.itemName;
      $q.when($parse(result.collection)($scope.$parent)).then(items => this.popupItems = items);
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
    [tab]: () => this.selectSelection(),
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
    this.setSelection(Math.max(Math.min(this.selectedSelectionIndex + offset, this.popupItems.length - 1), -1));
  }

  setSelection(index: number) {
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

  selectSelection(): boolean {

    if (this.selectedSelectionIndex >= 0) {
      this.ngModel = this.popupItems[this.selectedSelectionIndex];
    }

    this.close();

    return this.selectedSelectionIndex >= 0;
  }

  private findSelectionIndex() {
    for (let i = 0; i < this.popupItems.length; i++) {
      const item = this.popupItems[i];

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
    link($scope: SelectionScope, element: JQuery, _attributes: IAttributes, controller: IowSelectController<any>) {

      const iowSelectElement = element.closest('iow-select');

      const keyDownHandler = (event: JQueryEventObject) => $scope.$apply(() => controller.keyPressed(event));
      const clickHandler = () => $scope.$apply(() => controller.toggleOpen());
      const blurClickHandler = (event: JQueryEventObject) => {

        const eventIowSelectElement = angular.element(event.target).closest('iow-select');

        if (eventIowSelectElement[0] !== iowSelectElement[0]) {
          $scope.$apply(() => controller.close());
          $document.off('click', blurClickHandler);
        }
      };
      const focusHandler = () => $document.on('click', blurClickHandler);

      element.on('click', clickHandler);
      element.on('keydown', keyDownHandler);
      element.on('focus', focusHandler);

      $scope.$on('$destroy', () => {
        element.off('click', clickHandler);
        element.off('keydown', keyDownHandler);
        element.off('focus', focusHandler);
      });

      controller.element = element;
    }
  };
});

mod.directive('iowSelectionTransclude', () => {
  return {
    link($scope: SelectionScope, element: JQuery, _attribute: IAttributes, _controller: any, transclude: ITranscludeFunction) {

      let childScope: IScope;

      $scope.$watch(() => $scope.ctrl.ngModel, item => {
        if (!childScope) {
          transclude((clone, transclusionScope) => {
            childScope = transclusionScope!;
            transclusionScope![$scope.ctrl.popupItemName] = item;
            element.append(clone!);
          });
        } else {
          childScope[$scope.ctrl.popupItemName] = item;
        }
      });
    }
  };
});

mod.directive('iowSelectableItemTransclude', () => {
  return {
    link($scope: SelectionScope, element: JQuery, _attribute: IAttributes, _controller: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope![$scope.ctrl.popupItemName] = $scope[$scope.ctrl.popupItemName];
        element.append(clone!);
      });
    }
  };
});
