import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Model, CodeScheme } from '../../services/entities';
import { LanguageService, Localizer } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { module as mod }  from './module';
import { createExistsExclusion } from '../../utils/exclusion';
import { collectIds } from '../../utils/entity';
import { SearchCodeSchemeModal } from './searchCodeSchemeModal';
import { EditCodeSchemeModal } from './editCodeSchemeModal';

mod.directive('codeSchemesView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Code schemes</span> 
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addCodeScheme()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Add code scheme</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.codeSchemes" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['codeSchemesView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [CodeSchemesViewController, ModelViewController]) {
      thisController.isEditing = () => !modelViewController || modelViewController.isEditing();
    },
    controller: CodeSchemesViewController
  };
});

class CodeSchemesViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: CodeSchemeTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope, private searchCodeSchemeModal: SearchCodeSchemeModal, private editCodeSchemeModal: EditCodeSchemeModal, private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new CodeSchemeTableDescriptor(model, languageService.createLocalizer(model), editCodeSchemeModal);
    });
  }

  addCodeScheme() {
    const exclude = createExistsExclusion(collectIds(this.model.codeSchemes));

    this.searchCodeSchemeModal.open(this.model, exclude)
      .then(codeScheme => {
        this.model.addCodeScheme(codeScheme);
        this.expanded = true;
      });
  }
}

class CodeSchemeTableDescriptor extends TableDescriptor<CodeScheme> {

  constructor(private model: Model, private localizer: Localizer, private editCodeSchemeModal: EditCodeSchemeModal) {
    super();
  }

  columnDescriptors(codeSchemes: CodeScheme[]): ColumnDescriptor<CodeScheme>[] {
    return [
      { headerName: 'Code scheme URI', nameExtractor: codeScheme => codeScheme.id.uri },
      { headerName: 'Code scheme name', nameExtractor: codeScheme => this.localizer.translate(codeScheme.title) },
      { headerName: 'Description', nameExtractor: codeScheme => this.localizer.translate(codeScheme.description) }
    ];
  }

  canEdit(codeScheme: CodeScheme): boolean {
    return codeScheme.isExternal();
  }

  edit(value: CodeScheme): any {
    this.editCodeSchemeModal.openEdit(value, this.model, this.localizer.language);
  }

  canRemove(codeScheme: CodeScheme): boolean {
    return true;
  }

  orderBy(codeScheme: CodeScheme): any {
    return codeScheme.identifier;
  }
}
