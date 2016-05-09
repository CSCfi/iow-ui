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
        thisController.isRequireInUse = require => modelViewController.isRequireInUse(require);
      }
    },
    controller: RequiresViewController
  };
});

class RequiresViewController {
  model: Model;
  descriptor: RequireTableDescriptor;
  expanded = false;
  isRequireInUse: (require: Require) => boolean;

  constructor($scope: IScope, addEditRequireModal: AddEditRequireModal, languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new RequireTableDescriptor(addEditRequireModal, model, languageService, this.isRequireInUse);
    });
  }

  open(require: Require) {
    this.expanded = true;
  }
}

class RequireTableDescriptor extends TableDescriptor<Require> {

  constructor(private addEditRequireModal: AddEditRequireModal, private model: Model, private languageService: LanguageService, private isRequireInUse: (require: Require) => boolean) {
    super();
  }

  columnDescriptors(requires: Require[]): ColumnDescriptor<Require>[] {
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

  canRemove(require: Require): boolean {
    return !this.isRequireInUse(require);
  }
}
