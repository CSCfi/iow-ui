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

mod.directive('autocomplete', ($document: JQuery) => {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      fetchData: '=',
      matches: '=',
      propertyExtractor: '=',
      formatter: '='
    },
    bindToController: true,
    template: `
      <ng-transclude></ng-transclude>
      <div ng-if="ctrl.show" ng-class="{open: ctrl.show}">
        <ul class="dropdown-menu" ng-show="ctrl.show" ng-style="ctrl.popupStyle">
          <li ng-repeat="match in ctrl.dataMatches" 
              ng-class="{ active: ctrl.isSelected($index) }" 
              ng-mouseenter="ctrl.setSelection($index)" 
              ng-click="ctrl.selectSelection()" 
              autocomplete-item>
            <a href="">{{ctrl.format(match)}}</a>
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
        } else {
          event.preventDefault();
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
          thisController.autocomplete(viewValue);
        }
      });

      thisController.applyValue = (value: string) => {
        ignoreNextViewChange = true;
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

  fetchData: () => IPromise<T[]>;
  matches: (search: string, item: T) => boolean;
  propertyExtractor: (item: T) => any;

  formatter: (item: T) => string;
  inputFormatter: IModelFormatter|IModelFormatter[];
  dimensions: { left: number, top: number, width: number };
  applyValue: (value: string) => void;

  dataMatches: T[] = [];

  selectionIndex = -1;

  private keyEventHandlers: {[key: number]: () => void|boolean} = {
    [arrowDown]: () => this.moveSelection(1),
    [arrowUp]: () => this.moveSelection(-1),
    [pageDown]: () => this.moveSelection(10),
    [pageUp]: () => this.moveSelection(-10),
    [enter]: () => {
      this.selectSelection();
      this.clear();
    },
    [tab]: () => {
      this.selectSelection();
      this.clear();
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
    } else {
      this.selectionIndex = -1;
    }
  }

  private moveSelection(offset: number) {
    this.setSelection(Math.max(Math.min(this.selectionIndex + offset, this.dataMatches.length - 1), -1));
  }

  private setSelection(index: number) {
    this.selectionIndex = index;
  }

  isSelected(index: number) {
    return index === this.selectionIndex;
  }

  format(value: T): string {
    if (!this.formatter) {
      return this.formatProperty(value);
    } else {
      return this.formatter(value);
    }
  }

  formatProperty(value: T): string {
    return formatWithFormatters(this.extractProperty(value), this.inputFormatter);
  }

  extractProperty(value: T): any {
    if (this.propertyExtractor) {
      return this.propertyExtractor(value);
    } else {
      return value;
    }
  }

  autocomplete(search: string) {

    if (search) {
      this.fetchData().then(data => {
        const matches = _.filter(data, item => this.matches(search, item));

        if (matches.length === 0) {
          this.clear();
        } else {
          this.setMatchesAndSelectFirst(matches);
        }
      });
    } else {
      this.clear();
    }
  }

  clear() {
    this.selectionIndex = -1;
    this.dataMatches = [];
  }

  setMatchesAndSelectFirst(dataMatches: T[]) {
    this.dataMatches = dataMatches;
    this.selectionIndex = 0;
  }

  selectSelection() {
    const value = this.selectionIndex >= 0 ? this.dataMatches[this.selectionIndex] : null;

    if (value) {
      this.applyValue(this.formatProperty(value));
    }

    this.clear();
  }

  get show() {
    return this.dataMatches.length > 0;
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
      $scope.$watch(() => controller.selectionIndex, index => {
        if ($scope.$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
});
