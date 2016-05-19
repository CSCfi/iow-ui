import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IRepeatScope = angular.IRepeatScope;
import IModelFormatter = angular.IModelFormatter;
import { isDefined } from '../../utils/object';
import { esc, tab, enter, pageUp, pageDown, arrowUp, arrowDown } from '../../utils/keyCode';
import { formatWithFormatters, scrollToElement } from '../../utils/angular';
import { module as mod }  from './module';

const maxMatches = 500;

mod.directive('autocomplete', ($document: JQuery) => {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      datasource: '=',
      matcher: '=',
      formatter: '=',
      valueExtractor: '='
    },
    bindToController: true,
    template: `
      <ng-transclude></ng-transclude>
      <div ng-if="ctrl.show" ng-class="{open: ctrl.show}">
        <ul class="dropdown-menu" ng-show="ctrl.show" ng-style="ctrl.popupStyle">
          <li ng-repeat="match in ctrl.autocompleteMatches track by ctrl.formatValue(match)"
              class="ng-animate-disabled"
              ng-class="{ active: ctrl.isSelected($index) }" 
              ng-mouseenter="ctrl.setSelection($index)" 
              ng-mousedown="ctrl.selectSelection(event)"
              autocomplete-item>
            <a href="">{{::ctrl.format(match)}}</a>
          </li>
        </ul>
      </div>
    `,
    controller: AutocompleteController,
    controllerAs: 'ctrl',
    require: 'autocomplete',
    link($scope: IScope, element: JQuery, attributes: IAttributes, thisController: AutocompleteController<any>) {

      const inputElement = element.find('input');
      const ngModel: INgModelController = inputElement.controller('ngModel');

      $scope.$watchCollection(() => ngModel.$formatters, formatters => thisController.inputFormatter = formatters);

      const keyDownHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.keyPressed(event));
      const focusHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.autocomplete(ngModel.$viewValue));
      const blurClickHandler = (event: JQueryEventObject) => {

        const autocomplete = angular.element(event.target).closest('autocomplete');

        if (autocomplete[0] !== element[0]) {
          $scope.$apply(() => thisController.clear());
        }
      };

      inputElement.on('keydown', keyDownHandler);
      inputElement.on('focus', focusHandler);
      $document.on('click', blurClickHandler);

      $scope.$on('destroy', () => {
        inputElement.off('keydown', keyDownHandler);
        inputElement.off('focus', focusHandler);
        $document.off('click', blurClickHandler);
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

      $scope.$watch(() => inputElement.position().top, top => {
        thisController.dimensions = {
          top: top + inputElement.prop('offsetHeight'),
          left: inputElement.position().left,
          width: inputElement.outerWidth()
        };
      });
    }
  };
});

export class AutocompleteController<T> {

  datasource: (search: string) => IPromise<T[]>;
  matcher: (search: string, item: T) => boolean;
  formatter: (item: T) => string;
  valueExtractor: (item: T) => any;

  inputFormatter: IModelFormatter|IModelFormatter[];
  dimensions: { left: number, top: number, width: number };
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
      return _.contains(this.format(value).toLowerCase(), search.toLowerCase());
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
    this.datasource(search).then(data => {
      if (search) {
        this.setMatches(_.filter(data, item => this.match(search, item)), true);
      } else {
        this.setMatches(data, false);
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

  get popupStyle() {
    return {
      top: this.dimensions.top + 'px',
      left: this.dimensions.left + 'px',
      width: this.dimensions.width + 'px'
    };
  }
}

mod.directive('autocompleteItem', () => {
  return {
    restrict: 'A',
    require: '^autocomplete',
    link($scope: IRepeatScope, element: JQuery, attributes: IAttributes, controller: AutocompleteController<any>) {
      $scope.$watch(() => controller.autocompleteSelectionIndex, index => {
        if ($scope.$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
});
