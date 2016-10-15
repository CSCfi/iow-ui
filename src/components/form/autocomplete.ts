import { IScope, IAttributes, INgModelController, IQService, IRepeatScope, IModelFormatter } from 'angular';
import * as _ from 'lodash';
import { isDefined } from '../../utils/object';
import { esc, tab, enter, pageUp, pageDown, arrowUp, arrowDown } from '../../utils/keyCode';
import { formatWithFormatters, scrollToElement } from '../../utils/angular';
import { module as mod }  from './module';
import { DataSource } from './dataSource';

const maxMatches = 500;

// FIXME: copy-paste with iowSelect
mod.directive('autocomplete', ($document: JQuery) => {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      datasource: '=',
      matcher: '=',
      formatter: '=',
      valueExtractor: '=',
      excludeProvider: '=?'
    },
    bindToController: true,
    template: `
      <ng-transclude></ng-transclude>
      <div ng-if-body="ctrl.show" class="input-popup">
        <ul class="dropdown-menu" ng-style="ctrl.popupStyle">
          <li ng-repeat="match in ctrl.autocompleteMatches track by ctrl.formatValue(match)"
              class="ng-animate-disabled"
              ng-class="{ active: ctrl.isSelected($index) }" 
              ng-mouseenter="ctrl.setSelection($index)" 
              ng-mousedown="ctrl.selectSelection(event)"
              autocomplete-item="ctrl">
            <a href=""><span class="content">{{::ctrl.format(match)}}</span></a>
          </li>
        </ul>
      </div>
    `,
    controller: AutocompleteController,
    controllerAs: 'ctrl',
    require: 'autocomplete',
    link($scope: IScope, element: JQuery, _attributes: IAttributes, thisController: AutocompleteController<any>) {

      const inputElement = element.find('input');
      const ngModel: INgModelController = inputElement.controller('ngModel');

      $scope.$watchCollection(() => ngModel.$formatters, formatters => thisController.inputFormatter = formatters);

      const keyDownHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.keyPressed(event));
      const focusHandler = () => {
        $document.on('click', blurClickHandler);
        $scope.$apply(() => thisController.autocomplete(ngModel.$viewValue));
      };
      const blurClickHandler = (event: JQueryEventObject) => {

        const autocomplete = angular.element(event.target).closest('autocomplete');

        if (autocomplete[0] !== element[0]) {
          $scope.$apply(() => thisController.clear());
          $document.off('click', blurClickHandler);
        }
      };

      inputElement.on('keydown', keyDownHandler);
      inputElement.on('focus', focusHandler);

      $scope.$on('$destroy', () => {
        inputElement.off('keydown', keyDownHandler);
        inputElement.off('focus', focusHandler);
      });

      let ignoreNextViewChange = false;

      $scope.$watch(() => ngModel.$viewValue, viewValue => {
        if (ignoreNextViewChange) {
          ignoreNextViewChange = false;
        } else {
          // prevents initial triggering when user is not actually inputting anything
          if (inputElement.is(":focus")) {
            thisController.autocomplete(viewValue);
          }
        }
      });

      thisController.applyValue = (value: string) => {
        ignoreNextViewChange = ngModel.$viewValue !== value;
        ngModel.$setViewValue(value);
        ngModel.$render();
      };

      const isFixed = (e: JQuery) => {
        for (let p = e.parent(); p && p.length > 0 && !p.is('body'); p = p.parent()) {
          if (p.css('position') === 'fixed') {
            return true;
          }
        }

        return false;
      };

      const calculatePopupStyle = (e: JQuery) => {
        const offset = e.offset();
        const fixed = isFixed(e);
        return {
          position: fixed ? 'fixed' : 'absolute',
          top: offset.top + e.prop('offsetHeight') - (fixed ? window.scrollY : 0),
          left: offset.left,
          width: e.prop('offsetWidth')
        };
      };

      $scope.$watch(() => thisController.show, () => thisController.popupStyle = calculatePopupStyle(inputElement));
      $scope.$watch(() => inputElement.offset(), () => thisController.popupStyle = calculatePopupStyle(inputElement), true);

      const setPopupStyleToElement = () => {
        if (thisController.show) {
          thisController.popupStyle = calculatePopupStyle(inputElement);
          // apply styles without invoking scope for performance reasons
          // FIXME dropdown should be own directive
          angular.element('div.input-popup .dropdown-menu').css(thisController.popupStyle);
        }
      };

      window.addEventListener('resize', setPopupStyleToElement);

      $scope.$on('$destroy', () => {
        window.removeEventListener('resize', setPopupStyleToElement);
      });
    }
  };
});

export class AutocompleteController<T> {

  datasource: DataSource<T>;
  matcher: (search: string, item: T) => boolean;
  formatter: (item: T) => string;
  valueExtractor: (item: T) => any;
  excludeProvider?: () => (item: T) => string;

  inputFormatter: IModelFormatter|IModelFormatter[];
  popupStyle: { left: string|number, top: string|number, width: string|number, position: string };
  applyValue: (value: string) => void;

  autocompleteMatches: T[] = [];
  autocompleteSelectionIndex = -1;

  private keyEventHandlers: {[key: number]: () => void|boolean} = {
    [arrowDown]: () => this.moveSelection(1),
    [arrowUp]: () => this.moveSelection(-1),
    [pageDown]: () => this.moveSelection(10),
    [pageUp]: () => this.moveSelection(-10),
    [enter]: () => this.selectSelection(),
    [tab]: () => {
      this.selectSelection();
      return false;
    },
    [esc]: () => this.clear()
  };

  constructor(private $q: IQService) {
  }

  keyPressed(event: JQueryEventObject) {
    const handler = this.keyEventHandlers[event.keyCode];
    if (handler) {
      const preventDefault = handler();
      if (!isDefined(preventDefault) || preventDefault === true) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  private moveSelection(offset: number) {
    this.setSelection(Math.max(Math.min(this.autocompleteSelectionIndex + offset, this.autocompleteMatches.length - 1), -1));
  }

  private setSelection(index: number) {
    this.autocompleteSelectionIndex = index;
  }

  isSelected(index: number) {
    return index === this.autocompleteSelectionIndex;
  }

  format(value: T): string {
    if (!this.formatter) {
      return this.formatValue(value);
    } else {
      return this.formatter(value);
    }
  }

  match(search: string, value: T): boolean {
    if (!this.matcher) {
      return this.format(value).toLowerCase().indexOf(search.toLowerCase()) !== -1;
    } else {
      return this.matcher(search, value);
    }
  }

  formatValue(value: T): string {
    return formatWithFormatters(this.extractValue(value), this.inputFormatter);
  }

  extractValue(value: T): any {
    if (this.valueExtractor) {
      return this.valueExtractor(value);
    } else {
      return value;
    }
  }

  autocomplete(search: string) {
    this.$q.when(this.datasource(search)).then(data => {

      const exclude = this.excludeProvider && this.excludeProvider();
      const included = data.filter(item => !exclude || !exclude(item));

      if (search) {
        this.setMatches(included.filter(item => this.match(search, item)), true);
      } else {
        this.setMatches(included, false);
      }
    });
  }

  clear() {
    this.setMatches([], false);
  }

  setMatches(dataMatches: T[], selectFirst: boolean) {
    this.autocompleteSelectionIndex = selectFirst ? 0 : -1;
    this.autocompleteMatches = maxMatches > 0 ?  _.take(dataMatches, maxMatches) : dataMatches;
  }

  selectSelection(event?: JQueryEventObject) {

    if (event) {
      event.preventDefault();
    }

    const value = this.autocompleteSelectionIndex >= 0 ? this.autocompleteMatches[this.autocompleteSelectionIndex] : null;

    if (value) {
      this.applyValue(this.formatValue(value));
    }

    this.clear();
  }

  get show() {
    return this.autocompleteMatches.length > 0;
  }
}

interface AutocompleteItemScope extends IRepeatScope {
  autocompleteItem: AutocompleteController<any>;
}

mod.directive('autocompleteItem', () => {
  return {
    restrict: 'A',
    scope: {
      autocompleteItem: '='
    },
    link($scope: AutocompleteItemScope, element: JQuery) {
      $scope.$watch(() => $scope.autocompleteItem.autocompleteSelectionIndex, index => {
        if ($scope.$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
});
