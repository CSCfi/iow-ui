import { IAttributes, IScope } from 'angular';
import { EditableForm } from './editableEntityController';
import { module as mod }  from './module';
import { Url } from '../../entities/uri';
import * as _ from 'lodash';

mod.directive('editableTable', () => {
  return {
    scope: {
      descriptor: '=',
      expanded: '='
    },
    restrict: 'E',
    template: `
    <p ng-if="ctrl.visibleValues === 0" translate>None added</p>
    <table ng-if="ctrl.visibleValues > 0" class="table table-hover editable-table" drag-sortable="ctrl.values" drag-disabled="!ctrl.canSort()">
      <thead>
        <tr>
          <th ng-class="property.cssClass" ng-repeat="property in ctrl.properties">{{property.headerName | translate}}</th>
          <th class="action"></th>
          <th class="action"></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="value in ctrl.values | filter: ctrl.filter | orderBy: ctrl.orderBy" ng-class="['expandable-table', {collapsed: ctrl.limit && $index >= ctrl.limit}]" ng-init="valueIndex = $index" drag-sortable-item>
          <td ng-class="property.cssClass" ng-repeat="property in ctrl.properties">
            <span ng-if="!property.hrefExtractor && !property.onClick">{{property.nameExtractor(value)}}</span>
            <a ng-if="property.hrefExtractor" target="_blank" ng-href="{{property.hrefExtractor(value)}}">{{property.nameExtractor(value)}}</a>
            <a ng-if="property.onClick" ng-click="property.onClick(value)">{{property.nameExtractor(value)}}</a>
          </td>
          <td ng-class="[ 'action', 'remove', { editable: ctrl.canRemove(value) } ]" ng-click="ctrl.remove(value, valueIndex)"><i class="fa fa-trash" uib-tooltip="{{'Remove' | translate}}"></i></td>
          <td ng-class="[ 'action', 'edit', { editable: ctrl.canEdit(value) } ]" ng-click="ctrl.edit(value, valueIndex)"><i class="fa fa-pencil" uib-tooltip="{{'Edit' | translate}}"></i></td>
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
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [EditableTableController<any>, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableTableController
  };
});

export abstract class TableDescriptor<T> {

  abstract columnDescriptors(): ColumnDescriptor<T>[];
  abstract canEdit(value: T): boolean;
  abstract canRemove(value: T): boolean;
  abstract values(): T[];

  hasOrder(): boolean {
    return false;
  }

  edit(_value: T): any {
  }

  remove(_value: T): any {
  }

  filter(_value: T): boolean {
    return true;
  }

  orderBy(_value: T): any {
    return undefined;
  }
}

export type ColumnDescriptor<T> = {
  headerName: string,
  nameExtractor: (value: T) => string,
  hrefExtractor?: (value: T) => Url,
  onClick?: (value: T) => any;
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
    $scope.$watchCollection(() => this.descriptor ? this.descriptor.values() : [], values => {
      this.values = values;

      if (values && this.descriptor) {
        this.properties = this.descriptor.columnDescriptors();
        this.visibleValues = values ? _.filter(values, this.filter).length : 0;
      }
    });
  }

  canSort() {
    return this.descriptor && this.descriptor.hasOrder() && this.isEditing();
  }

  remove(value: T) {
    if (this.canRemove(value)) {
      this.descriptor.remove(value);
    }
  }

  edit(value: T) {
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
