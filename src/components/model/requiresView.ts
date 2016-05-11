import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Model, Require, NamespaceType } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { ColumnDescriptor, TableDescriptor } from '../form/editableTable';
import { AddEditRequireModal } from './addEditRequireModal';
import { SearchRequireModal } from './searchRequireModal';
import { ModelController } from './model';
import { ModelViewController } from './modelView';
import { module as mod }  from './module';
import { combineExclusions } from '../../utils/exclusion';

mod.directive('requiresView', () => {
  return {
    scope: {
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Imported requires</span>
        <button type="button" class="btn btn-default btn-xs pull-right" ng-click="ctrl.addRequire()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Add require</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.requires" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['requiresView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [RequiresViewController, ModelViewController]) {
      thisController.isEditing = () => !modelViewController || modelViewController.isEditing();
    },
    controller: RequiresViewController
  };
});

class RequiresViewController {

  model: Model;
  modelController: ModelController;
  isEditing: () => boolean;

  descriptor: RequireTableDescriptor;
  expanded = false;

  constructor($scope: IScope, private searchRequireModal: SearchRequireModal, addEditRequireModal: AddEditRequireModal, private languageService: LanguageService) {
    $scope.$watchGroup([() => this.model, () => this.modelController], ([model, modelController]) => {
      this.descriptor = new RequireTableDescriptor(addEditRequireModal, model, languageService, modelController);
    });
  }

  addRequire() {
    const language = this.languageService.getModelLanguage(this.model);

    const existsExclude = (require: Require) => {
      for (const ns of this.model.getNamespaces()) {
        if (ns.type !== NamespaceType.IMPLICIT_TECHNICAL && (ns.prefix === require.prefix || ns.url === require.namespace)) {
          return 'Already added';
        }
      }
      return null;
    };

    const profileExclude = (require: Require) => (!allowProfiles && require.isOfType('profile')) ? 'Cannot require profile' : null;
    const exclude = combineExclusions(existsExclude, profileExclude);
    const allowProfiles = this.model.isOfType('profile');

    this.searchRequireModal.open(this.model, language, exclude)
      .then((require: Require) => {
        this.model.addRequire(require);
        this.expanded = true;
      });
  }
}

class RequireTableDescriptor extends TableDescriptor<Require> {

  constructor(private addEditRequireModal: AddEditRequireModal, private model: Model, private languageService: LanguageService, private modelController: ModelController) {
    super();
  }

  columnDescriptors(requires: Require[]): ColumnDescriptor<Require>[] {
    return [
      { headerName: 'Prefix', nameExtractor: require => require.prefix, cssClass: 'prefix' },
      { headerName: 'Require label', nameExtractor: require => this.languageService.translate(require.label, this.model) },
      { headerName: 'Namespace', nameExtractor: require => require.namespace }
    ];
  }

  orderBy(require: Require) {
    return require.prefix;
  }

  edit(require: Require) {
    this.addEditRequireModal.openEdit(require, this.model, this.languageService.getModelLanguage(this.model));
  }

  canEdit(require: Require): boolean {
    return require.namespaceModifiable || require.prefixModifiable || require.labelModifiable;
  }

  canRemove(require: Require): boolean {
    return !this.modelController || !this.modelController.getRequiredModels().has(require.id.uri);
  }
}
