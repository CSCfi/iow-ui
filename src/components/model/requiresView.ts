import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Model, Require } from '../../services/entities';
import { module as mod }  from './module';
import { LanguageService } from '../../services/languageService';
import { ColumnDescriptor, TableDescriptor } from '../form/editableTable';
import { AddEditRequireModal } from './addEditRequireModal';
import { ModelViewController } from './modelView';

mod.directive('requiresView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4 translate>Imported requires</h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.requires" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['requiresView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [RequiresViewController, ModelViewController]) {
      if (modelViewController) {
        modelViewController.registerRequiresView(thisController);
      }
    },
    controller: RequiresViewController
  };
});

class RequiresViewController {
  model: Model;
  descriptor: RequirePropertyDescriptor;
  expanded = false;

  constructor($scope: IScope, addEditRequireModal: AddEditRequireModal, languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new RequirePropertyDescriptor(addEditRequireModal, model, languageService);
    });
  }

  open(require: Require) {
    this.expanded = true;
  }
}

class RequirePropertyDescriptor extends TableDescriptor<Require> {

  constructor(private addEditRequireModal: AddEditRequireModal, private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(values: Require[]): ColumnDescriptor<Require>[] {
    return [
      new ColumnDescriptor('Prefix', (require: Require) => require.prefix, 'prefix'),
      new ColumnDescriptor('Require label', (require: Require) => this.languageService.translate(require.label, this.model)),
      new ColumnDescriptor('Namespace', (require: Require) => require.namespace)
    ];
  }

  edit(require: Require) {
    this.addEditRequireModal.openEdit(require, this.model, this.languageService.getModelLanguage(this.model));
  }

  canEdit(require: Require): boolean {
    return require.namespaceModifiable || require.prefixModifiable || require.labelModifiable;
  }

  canRemove(value: Require): boolean {
    return true;
  }

  trackBy(require: Require): any {
    return require.id.value;
  }
}
