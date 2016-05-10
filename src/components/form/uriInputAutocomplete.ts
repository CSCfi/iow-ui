import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import ITimeoutService = angular.ITimeoutService;
import IRepeatScope = angular.IRepeatScope;
import { module as mod }  from './module';
import { scrollToElement, isDefined, createDefinedByExclusion, keyCodes } from '../../services/utils';
import { Model, Type, PredicateListItem, ClassListItem } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';

// TODO: separate uri input related logic from autocomplete logic
mod.directive('uriInputAutocomplete', ($document: JQuery) => {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      type: '@',
      model: '='
    },
    bindToController: true,
    template: `
               <ng-transclude></ng-transclude>
               <div ng-if="ctrl.show" ng-class="{open: ctrl.show}">
                 <ul ng-class="'dropdown-menu'" ng-show="ctrl.show" ng-style="ctrl.popupStyle">
                   <li ng-repeat="match in ctrl.matches" 
                       ng-class="{ active: ctrl.isSelected($index) }" 
                       ng-mouseenter="ctrl.setSelection($index)" 
                       ng-click="ctrl.selectSelection()" 
                       uri-input-autocomplete-item>
                     <a href="">{{ctrl.format(match)}}</a>
                   </li>
                 </ul>
               </div>
               `,
    controller: UriInputAutocompleteController,
    controllerAs: 'ctrl',
    require: 'uriInputAutocomplete',
    link($scope: IScope, element: JQuery, attributes: IAttributes, thisController: UriInputAutocompleteController) {

      const inputElement = element.find('input');
      const ngModel: INgModelController = inputElement.controller('ngModel');

      const keyDownHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.keyPressed(event));
      const focusHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.autocomplete(ngModel.$viewValue));
      const blurClickHandler = (event: JQueryEventObject) => {
        const autocomplete = angular.element(event.target).closest('uri-input-autocomplete');

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
        $document.off('clock', blurClickHandler);
      });

      $scope.$watch(() => ngModel.$viewValue, viewValue => thisController.autocomplete(viewValue));
      $scope.$watch(() => inputElement.position().top, top => {
        thisController.dimensions = {
          top: top + inputElement.prop('offsetHeight'),
          left: inputElement.position().left,
          width: inputElement.outerWidth()
        };
      });

      thisController.applyValue = (value: string) => {
        ngModel.$setViewValue(value);
        ngModel.$render();
      };
    }
  };
});


export class UriInputAutocompleteController {

  type: Type;
  model: Model;
  
  dimensions: { left: number, top: number, width: number };
  applyValue: (value: string) => void;

  data: (ClassListItem|PredicateListItem)[];
  matches: (ClassListItem|PredicateListItem)[] = [];

  selectionIndex = -1;

  private keyEventHandlers: {[key: number]: () => void|boolean} = {
    [keyCodes.arrowDown]: () => this.moveSelection(1),
    [keyCodes.arrowUp]: () => this.moveSelection(-1),
    [keyCodes.pageDown]: () => this.moveSelection(10),
    [keyCodes.pageUp]: () => this.moveSelection(-10),
    [keyCodes.enter]: () => this.selectSelection(),
    [keyCodes.tab]: () => {
      this.selectSelection();
      return false;
    },
    [keyCodes.esc]: () => this.clear()
  };

  constructor(private classService: ClassService, private predicateService: PredicateService) {
  }

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
    this.setSelection(Math.max(Math.min(this.selectionIndex + offset, this.data.length - 1), -1));
  }

  private setSelection(index: number) {
    this.selectionIndex = index;
  }

  isSelected(index: number) {
    return index === this.selectionIndex;
  }

  get selectionValue() {
    if (this.selectionIndex >= 0) {
      return this.matches[this.selectionIndex];
    } else {
      return null;
    }
  }

  format(item: ClassListItem|PredicateListItem) {
    return item.id.compact;
  }

  autocomplete(value: string) {

    const appendData = (data: ClassListItem[]|PredicateListItem[]) => {
      if (!this.data) {
        this.data = data;
      } else {
        this.data = this.data.concat(data);
      }

      this.autocomplete(value);
    };

    if (value) {
      if (!isDefined(this.data)) {
        switch (this.type) {
          case 'class':
            this.classService.getClassesForModel(this.model).then(appendData);
            this.classService.getExternalClassesForModel(this.model).then(appendData);
            break;
          case 'predicate':
            this.predicateService.getPredicatesForModel(this.model).then(appendData);
            this.predicateService.getExternalPredicatesForModel(this.model).then(appendData);
            break;
          default:
            throw new Error('Unsupported type: ' + this.type);
        }
      }

      const exclusion = createDefinedByExclusion(this.model);
      const matches = _.filter(this.data, item => !exclusion(item) && _.contains(this.format(item), value));

      if (matches.length === 0 || (matches.length === 1 && this.format(matches[0]) === value)) {
        this.clear();
      } else {
        this.selectionIndex = 0;
        this.matches = matches;
      }
    } else {
      this.clear();
    }
  }

  clear() {
    this.selectionIndex = -1;
    this.matches = [];
  }

  selectSelection() {
    if (this.selectionValue) {
      this.applyValue(this.format(this.selectionValue));
    }

    this.clear();
  }

  get show() {
    return this.matches.length > 0;
  }

  get popupStyle() {
    return {
      top: this.dimensions.top + 'px',
      left: this.dimensions.left + 'px',
      width: this.dimensions.width + 'px'
    };
  }
}

mod.directive('uriInputAutocompleteItem', () => {
  return {
    restrict: 'A',
    require: '^uriInputAutocomplete',
    link($scope: IRepeatScope, element: JQuery, attributes: IAttributes, controller: UriInputAutocompleteController) {
      $scope.$watch(() => controller.selectionIndex, index => {
        if ($scope.$index === index) {
          scrollToElement(element, element.parent());
        }
      });
    }
  };
});
