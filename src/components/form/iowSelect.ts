import { IAttributes, IDocumentService, IParseService, IQService, IRepeatScope, IScope, ITranscludeFunction } from 'angular';
import { isDefined } from '../../utils/object';
import { esc, tab, enter, pageUp, pageDown, arrowUp, arrowDown } from '../../utils/keyCode';
import { scrollToElement } from '../../utils/angular';
import { module as mod }  from './module';

// FIXME: copy-paste with autocomplete
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
        <div ng-if-body="ctrl.show" class="input-popup">
          <ul class="dropdown-menu" ng-style="ctrl.popupStyle">
            <li ng-repeat="item in ctrl.items"
                class="ng-animate-disabled"
                ng-class="{ active: ctrl.isSelected($index) }" 
                ng-mouseenter="ctrl.setSelection($index)" 
                ng-mousedown="ctrl.selectSelection(event)"
                iow-select-item="ctrl">
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
}

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
  popupStyle: { top: string|number, left: string|number, width: string|number };

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
      this.ngModel = this.items[this.selectedSelectionIndex];
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

      const calculatePopupStyle = (e: JQuery) => {
        const offset = e.offset();
        return {
          top: offset.top + e.prop('offsetHeight') - window.scrollY,
          left: offset.left,
          width: e.prop('offsetWidth')
        };
      };

      $scope.$watch(() => controller.show, () => controller.popupStyle = calculatePopupStyle(element));
      $scope.$watch(() => element.offset(), () => controller.popupStyle = calculatePopupStyle(element), true);

      const setPopupStyleToElement = () => {
        if (controller.show) {
          controller.popupStyle = calculatePopupStyle(element);
          // apply styles without invoking scope for performance reasons
          // FIXME dropdown should be own directive
          angular.element('div.input-popup .dropdown-menu').css(controller.popupStyle);
        }
      };

      window.addEventListener('resize', setPopupStyleToElement);
      window.addEventListener('scroll', setPopupStyleToElement, true);

      $scope.$on('$destroy', () => {
        window.removeEventListener('resize', setPopupStyleToElement);
        window.removeEventListener('scroll', setPopupStyleToElement);
      });
    }
  };
});

interface IowSelectItemScope extends IRepeatScope {
  iowSelectItem: IowSelectController<any>;
}

mod.directive('iowSelectItem', () => {
  return {
    restrict: 'A',
    scope: {
      iowSelectItem: '='
    },
    link($scope: IowSelectItemScope, element: JQuery) {
      $scope.$watch(() => $scope.iowSelectItem.selectedSelectionIndex, index => {
        if ($scope.$index === index) {
          scrollToElement(element, element.parent());
        }
      });
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
            transclusionScope![$scope.ctrl.itemName] = item;
            element.append(clone!);
          });
        } else {
          childScope[$scope.ctrl.itemName] = item;
        }
      });
    }
  };
});

interface SelectItemScope extends IRepeatScope, SelectionScope {
  item: any;
}

mod.directive('iowSelectableItemTransclude', () => {
  return {
    link($scope: SelectItemScope, element: JQuery, _attribute: IAttributes, _controller: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope![$scope.ctrl.itemName] = $scope.item;
        element.append(clone!);
      });
    }
  };
});
