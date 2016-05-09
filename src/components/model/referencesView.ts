import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Reference, Model } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { module as mod }  from './module';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';

mod.directive('referencesView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4 translate>References</h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.references" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['referencesView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [ReferencesViewController, ModelViewController]) {
      if (modelViewController) {
        modelViewController.registerReferencesView(thisController);
      }
    },
    controller: ReferencesViewController
  };
});

class ReferencesViewController {
  model: Model;

  descriptor: ReferenceTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope, private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new ReferenceTableDescriptor(model, languageService);
    });
  }

  open(reference: Reference) {
    this.expanded = true;
  }
}

class ReferenceTableDescriptor extends TableDescriptor<Reference> {

  constructor(private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(references: Reference[]): ColumnDescriptor<Reference>[] {
    return [
      new ColumnDescriptor('Identifier', (reference: Reference) => reference.vocabularyId, 'prefix'),
      new ColumnDescriptor('Vocabulary name', (reference: Reference) => this.languageService.translate(reference.label, this.model))
    ];
  }

  canEdit(reference: Reference): boolean {
    return false;
  }

  canRemove(reference: Reference): boolean {
    return !reference.local;
  }

  orderBy(reference: Reference): any {
    return this.languageService.translate(reference.label, this.model);
  }

  filter(reference: Reference) {
    return !reference.local;
  }
}
