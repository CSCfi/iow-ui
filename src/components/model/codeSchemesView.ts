import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Model, ReferenceData } from '../../services/entities';
import { LanguageService, Localizer } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { module as mod }  from './module';
import { createExistsExclusion } from '../../utils/exclusion';
import { collectIds } from '../../utils/entity';
import { SearchCodeSchemeModal } from './searchCodeSchemeModal';
import { EditCodeSchemeModal } from './editCodeSchemeModal';
import { ViewCodeSchemeModal } from './viewCodeSchemeModal';

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
  constructor($scope: IScope, private searchCodeSchemeModal: SearchCodeSchemeModal, editCodeSchemeModal: EditCodeSchemeModal, viewCodeSchemeModal: ViewCodeSchemeModal, languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new CodeSchemeTableDescriptor(model, languageService.createLocalizer(model), editCodeSchemeModal, viewCodeSchemeModal);
    });
  }

  addCodeScheme() {
    const exclude = createExistsExclusion(collectIds(this.model.codeSchemes));

    this.searchCodeSchemeModal.openSelectionForModel(this.model, exclude)
      .then(codeScheme => {
        this.model.addCodeScheme(codeScheme);
        this.expanded = true;
      });
  }
}

class CodeSchemeTableDescriptor extends TableDescriptor<ReferenceData> {

  constructor(private model: Model, private localizer: Localizer, private editCodeSchemeModal: EditCodeSchemeModal, private viewCodeSchemeModal: ViewCodeSchemeModal) {
    super();
  }

  columnDescriptors(codeSchemes: ReferenceData[]): ColumnDescriptor<ReferenceData>[] {

    const clickHandler = (value: ReferenceData) => {
      if (value.isExternal()) {
        window.open(value.id.uri, '_blank');
      } else {
        this.viewCodeSchemeModal.open(value, this.model);
      }
    };

    return [
      { headerName: 'Code scheme name', nameExtractor: codeScheme => this.localizer.translate(codeScheme.title), onClick: clickHandler },
      { headerName: 'Description', nameExtractor: codeScheme => this.localizer.translate(codeScheme.description) }
    ];
  }

  canEdit(codeScheme: ReferenceData): boolean {
    return codeScheme.isExternal();
  }

  edit(value: ReferenceData): any {
    this.editCodeSchemeModal.openEdit(value, this.model, this.localizer.language);
  }

  canRemove(codeScheme: ReferenceData): boolean {
    return true;
  }

  orderBy(codeScheme: ReferenceData): any {
    return codeScheme.identifier;
  }
}
