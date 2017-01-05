import { IAttributes, IScope } from 'angular';
import { ModelViewController } from './modelView';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { SearchVocabularyModal } from './searchVocabularyModal';
import { module as mod }  from './module';
import { createExistsExclusion } from '../../utils/exclusion';
import { ConceptEditorModal } from './conceptEditorModal';
import { collectProperties } from '../../utils/array';
import { requireDefined } from '../../utils/object';
import { Model, ModelVocabulary } from '../../entities/model';
import { Vocabulary } from '../../entities/vocabulary';
import { modalCancelHandler } from '../../utils/angular';

mod.directive('vocabulariesView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Controlled vocabularies</span> 
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addVocabulary()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Add vocabulary</span>
        </button>
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.browseConcepts()">
          <span class="fa fa-th"></span>
          <span translate>Browse concepts</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['vocabulariesView', '?^modelView'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, modelViewController]: [VocabulariesViewController, ModelViewController]) {
      thisController.isEditing = () => modelViewController && modelViewController.isEditing();
    },
    controller: VocabulariesViewController
  };
});

class VocabulariesViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: VocabularyTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private searchVocabularyModal: SearchVocabularyModal,
              private conceptEditorModal: ConceptEditorModal,
              languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new VocabularyTableDescriptor(model, languageService);
    });
  }

  browseConcepts() {
    this.conceptEditorModal.open(this.model);
  }

  addVocabulary() {
    const vocabularies = collectProperties(this.model.modelVocabularies, vocabulary => vocabulary.id.uri);
    const exclude = createExistsExclusion(vocabularies);

    this.searchVocabularyModal.open(this.model, exclude)
      .then((vocabulary: Vocabulary) => {
        this.model.addVocabulary(vocabulary);
        this.expanded = true;
      }, modalCancelHandler);
  }
}

class VocabularyTableDescriptor extends TableDescriptor<ModelVocabulary> {

  constructor(private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(): ColumnDescriptor<ModelVocabulary>[] {
    return [
      { headerName: 'Identifier', nameExtractor: vocabulary => requireDefined(vocabulary.material.code), cssClass: 'prefix', hrefExtractor: vocabulary => vocabulary.href},
      { headerName: 'Vocabulary name', nameExtractor: vocabulary => this.languageService.translate(vocabulary.title, this.model)}
    ];
  }

  values(): ModelVocabulary[] {
    return this.model && this.model.modelVocabularies;
  }

  canEdit(_vocabulary: ModelVocabulary): boolean {
    return false;
  }

  canRemove(vocabulary: ModelVocabulary): boolean {
    return !vocabulary.fixed;
  }

  remove(vocabulary: ModelVocabulary): any {
    this.model.removeVocabulary(vocabulary.vocabulary);
  }

  orderBy(vocabulary: ModelVocabulary): any {
    return vocabulary.id;
  }
}
