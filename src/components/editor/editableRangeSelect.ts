import { dataTypes, DataType } from '../../services/dataTypes';
import { module as mod }  from './module';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from '../form/editableEntityController';

// TODO duplication with editable just to get past
mod.directive('editableRangeSelect', () => {
  return {
    scope: {
      range: '=',
      id: '@'
    },
    restrict: 'E',
    template: `
      <div class="editable-wrap form-group">
        <editable-label data-title="'Range'" input-id="ctrl.id" required="true"></editable-label>
        
        <div ng-show="ctrl.isEditing()">
          <localized-select id="{{ctrl.id}}" values="ctrl.ranges" value="ctrl.range" display-name-formatter="ctrl.displayNameFormatter"></localized-select>
        </div>
      
        <div ng-if="!ctrl.isEditing()" class="content">
          <span>{{ctrl.displayName}}</span>
        </div>
        
        <error-messages ng-model-controller="ngModel"></error-messages>
      </div>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['editableRangeSelect', '^form'],
    link($scope: EditableScope, element: JQuery, attributes: angular.IAttributes, [thisController, formController]: [RangeSelectController, EditableForm]) {
      const input = element.find('[ng-model]');
      $scope.ngModel = input.controller('ngModel');
      thisController.isEditing = () => formController.editing;
    },
    controller: RangeSelectController
  };
});

interface EditableScope extends angular.IScope {
  ngModel: angular.INgModelController;
}

class RangeSelectController {

  range: DataType;
  ranges: DataType[] = dataTypes;
  displayNameFormatter = (value: string, gettextCatalog: gettextCatalog) => value ? `${gettextCatalog.getString(value)} (${value})` : '';
  isEditing: () => boolean;

  constructor(private gettextCatalog: gettextCatalog) {
  }

  get displayName() {
    return this.range ? this.displayNameFormatter(this.range, this.gettextCatalog) : '';
  }
}
