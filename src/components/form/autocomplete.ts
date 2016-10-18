import { IScope, IAttributes, INgModelController, IQService, IModelFormatter } from 'angular';
import * as _ from 'lodash';
import { isDefined } from '../../utils/object';
import { esc, tab, enter, pageUp, pageDown, arrowUp, arrowDown } from '../../utils/keyCode';
import { formatWithFormatters } from '../../utils/angular';
import { module as mod }  from './module';
import { DataSource } from './dataSource';
import { InputWithPopupController } from './inputPopup';

const maxMatches = 500;

// TODO: similarities with iowSelect
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
      <input-popup ctrl="ctrl"><span class="content">{{::ctrl.format(match)}}</span></input-popup>
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

      thisController.element = inputElement;
    }
  };
});

export class AutocompleteController<T> implements InputWithPopupController<T> {

  datasource: DataSource<T>;
  matcher: (search: string, item: T) => boolean;
  formatter: (item: T) => string;
  valueExtractor: (item: T) => any;
  excludeProvider?: () => (item: T) => string;

  inputFormatter: IModelFormatter|IModelFormatter[];
  applyValue: (value: string) => void;

  popupItems: T[] = [];
  selectedSelectionIndex = -1;

  popupItemName = 'match';
  element: JQuery;

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
    this.setSelection(Math.max(Math.min(this.selectedSelectionIndex + offset, this.popupItems.length - 1), -1));
  }

  setSelection(index: number) {
    this.selectedSelectionIndex = index;
  }

  isSelected(index: number) {
    return index === this.selectedSelectionIndex;
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
    this.selectedSelectionIndex = selectFirst ? 0 : -1;
    this.popupItems = maxMatches > 0 ?  _.take(dataMatches, maxMatches) : dataMatches;
  }

  selectSelection(event?: JQueryEventObject) {

    if (event) {
      event.preventDefault();
    }

    const value = this.selectedSelectionIndex >= 0 ? this.popupItems[this.selectedSelectionIndex] : null;

    if (value) {
      this.applyValue(this.formatValue(value));
    }

    this.clear();
  }

  get show() {
    return this.popupItems.length > 0;
  }
}
