import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Link, Model } from '../../services/entities';
import { AddEditLinkModal } from './addEditLinkModal';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { ModelViewController } from './modelView';
import { module as mod }  from './module';

mod.directive('linksView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Links</span> 
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addLink()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Add link</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['linksView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [LinksViewController, ModelViewController]) {
      thisController.isEditing = () => !modelViewController || modelViewController.isEditing();
    },
    controller: LinksViewController
  };
});

class LinksViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: LinkTableDescriptor;
  expanded = false;

  constructor($scope: IScope, private addEditLinkModal: AddEditLinkModal, private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new LinkTableDescriptor(addEditLinkModal, model, languageService);
    });
  }

  addLink() {
    this.addEditLinkModal.openAdd(this.model, this.languageService.getModelLanguage(this.model))
      .then((linktion: Link) => {
        this.model.addLink(linktion);
        this.expanded = true;
      });
  }
}

class LinkTableDescriptor extends TableDescriptor<Link> {

  constructor(private addEditLinkModal: AddEditLinkModal, private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(values: Link[]): ColumnDescriptor<Link>[] {
    return [
      { headerName: 'Title', nameExtractor: link => this.languageService.translate(link.title, this.model), hrefExtractor: link => link.homepage.uri },
      { headerName: 'Description', nameExtractor: link => this.languageService.translate(link.description, this.model) }
    ];
  }

  values(): Link[] {
    return this.model && this.model.links;
  }

  hasOrder() {
    return true;
  }

  edit(link: Link) {
    this.addEditLinkModal.openEdit(link, this.model, this.languageService.getModelLanguage(this.model));
  }

  remove(link: Link) {
    this.model.removeLink(link);
  }

  canEdit(link: Link): boolean {
    return true;
  }

  canRemove(link: Link): boolean {
    return true;
  }
}
