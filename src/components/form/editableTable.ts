import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IPromise = angular.IPromise;
import { EditableForm } from './editableEntityController';
import { module as mod }  from './module';
import { Url } from '../../services/uri';

mod.directive('editableTable', () => {
  return {
    scope: {
      values: '=',
      descriptor: '=',
      expanded: '='
    },
    restrict: 'E',
    template: `
    <p ng-if="ctrl.visibleValues === 0" translate>None added</p>
    <table ng-if="ctrl.visibleValues > 0" class="table table-hover editable-table">
      <thead>
        <tr>
          <th ng-class="property.cssClass" ng-repeat="property in ctrl.properties">{{property.headerName | translate}}</th>
          <th class="action"></th>
          <th class="action"></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="value in ctrl.values | filter: ctrl.filter | orderBy: ctrl.orderBy" ng-class="['expandable-table', {collapsed: ctrl.limit && $index >= ctrl.limit}]" ng-init="valueIndex = $index">
          <td ng-class="property.cssClass" ng-repeat="property in ctrl.properties">
            <span ng-if="!property.hrefExtractor(value)">{{property.nameExtractor(value)}}</span>
            <a ng-if="property.hrefExtractor(value)" ng-href="{{property.hrefExtractor(value)}}">{{property.nameExtractor(value)}}</a>
          </td>
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

  edit(value: T): any {
  }

  filter(value: T): boolean {
    return true;
  }

  orderBy(value: T): any {
    return undefined;
  }
}

export type ColumnDescriptor<T> = {
  headerName: string,
  nameExtractor: (value: T) => string,
  hrefExtractor?: (value: T) => Url,
  cssClass?: string
}

const nonExpandedLimit = 2;

class EditableTableController<T> {

  values: T[];
  expanded: boolean;

  isEditing: () => boolean;
  properties: ColumnDescriptor<T>[];
  descriptor: TableDescriptor<T>;
  visibleValues: number;

  filter = (value: T) => this.descriptor.filter(value);
  orderBy = (value: T) => this.descriptor.orderBy(value);

  constructor($scope: IScope) {

    const init = () => {
      if (this.values && this.descriptor) {
        this.properties = this.descriptor.columnDescriptors(this.values);
        this.visibleValues = this.values ? _.filter(this.values, this.filter).length : 0;
      }
    };

    $scope.$watchCollection(() => this.values, init);
    $scope.$watch(() => this.descriptor, init);
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
    return this.visibleValues > nonExpandedLimit;
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
