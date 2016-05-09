import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IPromise = angular.IPromise;
import { EditableForm } from './editableEntityController';
import { module as mod }  from './module';

mod.directive('editableTable', () => {
  return {
    scope: {
      values: '=',
      descriptor: '=',
      expanded: '='
    },
    restrict: 'E',
    template: `
    <p ng-if="ctrl.values.length === 0" translate>None added</p>
    <table ng-if="ctrl.values.length > 0" class="table table-hover editable-table">
      <thead>
        <tr>
          <th ng-class="property.cssClass" ng-repeat="property in ctrl.properties">{{property.headerName | translate}}</th>
          <th class="action"></th>
          <th class="action"></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="value in ctrl.values track by ctrl.descriptor.trackBy(value)" ng-class="['expandable-table', {collapsed: ctrl.limit && $index >= ctrl.limit}]" ng-init="valueIndex = $index">
          <td ng-class="property.cssClass" ng-repeat="property in ctrl.properties">{{property.nameExtractor(value)}}</td>
          <td ng-class="[ 'action', { editable: ctrl.canRemove(value) } ]" ng-click="ctrl.remove(value, valueIndex)"><i class="fa fa-trash" uib-tooltip="{{'Remove' | translate}}"></i></td>
          <td ng-class="[ 'action', { editable: ctrl.canEdit(value) } ]" ng-click="ctrl.edit(value, valueIndex)"><i class="fa fa-pencil" uib-tooltip="{{'Edit' | translate}}"></i></td>
        </tr>
      </tbody>
      <tfoot class="expander" ng-if="ctrl.canExpand()">
        <tr>
          <td colspan="{{ctrl.numberOfColumns}}" ng-click="ctrl.toggleExpand()"><i ng-class="ctrl.expanderClasses"></i></td>
        </tr>
      </tfoot>
    </table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['editableTable', '^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableTableController<any>, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableTableController
  };
});

export abstract class TableDescriptor<T> {

  abstract columnDescriptors(values: T[]): ColumnDescriptor<T>[];
  abstract canEdit(value: T): boolean;
  abstract canRemove(value: T): boolean;
  abstract trackBy(value: T): any;

  edit(value: T): any {
  }
}

export class ColumnDescriptor<T> {
  constructor(public headerName: string, public nameExtractor: (value: T) => string, public cssClass?: string) {
  }
}

const nonExpandedLimit = 2;

class EditableTableController<T> {

  values: T[];
  descriptor: TableDescriptor<T>;
  isEditing: () => boolean;

  properties: ColumnDescriptor<T>[];
  expanded: boolean;

  constructor($scope: IScope) {
    $scope.$watch(() => this.values, values => {
      this.properties = this.descriptor.columnDescriptors(values);
    });
  }

  remove(value: T, index: number) {
    if (this.canRemove(value)) {
      _.remove(this.values, value);
    }
  }

  edit(value: T, index: number) {
    if (this.canEdit(value)) {
      this.descriptor.edit(value);
    }
  }

  canEdit(value: T) {
    return this.isEditing() && this.descriptor.canEdit(value);
  }

  canRemove(value: T) {
    return this.isEditing() && this.descriptor.canRemove(value);
  }

  get numberOfColumns() {
    return this.properties.length + 2;
  }

  get limit() {
    return this.expanded ? null : nonExpandedLimit;
  }

  canExpand() {
    return this.values.length > nonExpandedLimit;
  }

  toggleExpand() {
    this.expanded = !this.expanded;
  }

  get expanderClasses() {
    return [
      'fa',
      {
        'fa-angle-double-down': !this.expanded,
        'fa-angle-double-up': this.expanded
      }
    ];
  }
}