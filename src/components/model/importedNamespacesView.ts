import { IAttributes, IScope } from 'angular';
import { LanguageService } from '../../services/languageService';
import { ColumnDescriptor, TableDescriptor } from '../form/editableTable';
import { AddEditNamespaceModal } from './addEditNamespaceModal';
import { SearchNamespaceModal } from './searchNamespaceModal';
import { ModelController } from './model';
import { ModelViewController } from './modelView';
import { combineExclusions } from '../../utils/exclusion';
import { module as mod }  from './module';
import { Model, ImportedNamespace, NamespaceType } from '../../entities/model';

mod.directive('importedNamespacesView', () => {
  return {
    scope: {
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Imported namespaces</span>
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.importNamespace()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Import namespace</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['importedNamespacesView', '?^modelView'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, modelViewController]: [ImportedNamespacesViewController, ModelViewController]) {
      thisController.isEditing = () => modelViewController && modelViewController.isEditing();
    },
    controller: ImportedNamespacesViewController
  };
});

class ImportedNamespacesViewController {

  model: Model;
  modelController: ModelController;
  isEditing: () => boolean;

  descriptor: ImportedNamespaceTableDescriptor;
  expanded = false;

  constructor($scope: IScope, private searchNamespaceModal: SearchNamespaceModal, addEditNamespaceModal: AddEditNamespaceModal, private languageService: LanguageService) {
    $scope.$watchGroup([() => this.model, () => this.modelController], ([model, modelController]) => {
      this.descriptor = new ImportedNamespaceTableDescriptor(addEditNamespaceModal, model, languageService, modelController);
    });
  }

  importNamespace() {
    const language = this.languageService.getModelLanguage(this.model);

    const existsExclude = (ns: ImportedNamespace) => {
      for (const existingNs of this.model.getNamespaces()) {
        if (existingNs.type !== NamespaceType.IMPLICIT_TECHNICAL && (existingNs.prefix === ns.prefix || existingNs.url === ns.namespace)) {
          return 'Already added';
        }
      }
      return null;
    };

    const allowProfiles = this.model.isOfType('profile');
    const profileExclude = (ns: ImportedNamespace) => (!allowProfiles && ns.isOfType('profile')) ? 'Cannot import profile' : null;
    const exclude = combineExclusions(existsExclude, profileExclude);

    this.searchNamespaceModal.open(this.model, language, exclude)
      .then((ns: ImportedNamespace) => {
        this.model.addNamespace(ns);
        this.expanded = true;
      });
  }
}

class ImportedNamespaceTableDescriptor extends TableDescriptor<ImportedNamespace> {

  constructor(private addEditNamespaceModal: AddEditNamespaceModal, private model: Model, private languageService: LanguageService, private modelController: ModelController) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<ImportedNamespace>[] {
    return [
      { headerName: 'Prefix', nameExtractor: ns => ns.prefix, cssClass: 'prefix' },
      { headerName: 'Namespace label', nameExtractor: ns => this.languageService.translate(ns.label, this.model) },
      { headerName: 'Namespace', nameExtractor: ns => ns.namespace }
    ];
  }

  values(): ImportedNamespace[] {
    return this.model && this.model.namespaces;
  }

  orderBy(ns: ImportedNamespace) {
    return ns.prefix;
  }

  edit(ns: ImportedNamespace) {
    this.addEditNamespaceModal.openEdit(ns, this.model, this.languageService.getModelLanguage(this.model));
  }

  remove(ns: ImportedNamespace) {
    this.model.removeNamespace(ns);
  }

  canEdit(ns: ImportedNamespace): boolean {
    return ns.namespaceModifiable || ns.prefixModifiable || ns.labelModifiable;
  }

  canRemove(ns: ImportedNamespace): boolean {
    return this.modelController && !this.modelController.getUsedNamespaces().has(ns.id.uri);
  }
}
