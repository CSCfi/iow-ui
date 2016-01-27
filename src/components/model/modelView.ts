import _ = require('lodash');
import ILogService = angular.ILogService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { EditableEntityController, EditableScope, EditableForm, Rights } from '../form/editableEntityController';
import { LanguageService } from '../../services/languageService';
import { GroupListItem, Model, Require, Reference, Uri, states } from '../../services/entities';
import { ModelController } from './modelController';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { collectIds, collectProperties } from '../../services/utils';
import { SearchSchemeModal } from './searchSchemeModal';
import { SearchRequireModal } from './searchRequireModal';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';

export const mod = angular.module('iow.components.model');

mod.directive('modelView', () => {
  return {
    scope: {
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ModelViewController
  };
});

interface View<T> {
  open(item: T): void;
}

export class ModelViewController extends EditableEntityController<Model> {

  visible: boolean = false;
  model: Model;
  modelController: ModelController;

  private referencesView: View<Reference>;
  private requiresView: View<Require>;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              private modelService: ModelService,
              deleteConfirmationModal: DeleteConfirmationModal,
              private searchSchemeModal: SearchSchemeModal,
              private searchRequireModal: SearchRequireModal,
              private languageService: LanguageService,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);

    this.modelController.registerView(this);

    $scope.$watch(() => this.isEditing(), editing => {
      if (editing) {
        this.visible = true;
      }
    });
  }

  registerReferencesView(view: View<Reference>) {
    this.referencesView = view;
  }

  registerRequiresView(view: View<Require>) {
    this.requiresView = view;
  }

  addReference() {
    const language = this.languageService.modelLanguage;
    const vocabularyMap = collectProperties(this.editableInEdit.references, reference => reference.vocabularyId);
    this.searchSchemeModal.open(vocabularyMap, language)
      .then((scheme: any) => this.modelService.newReference(scheme, language, this.model.context))
      .then((reference: Reference) => {
        this.editableInEdit.addReference(reference);
        this.referencesView.open(reference);
      });
  }

  removeReference(reference: Reference) {
    this.editableInEdit.removeReference(reference);
  }

  addRequire() {
    const language = this.languageService.modelLanguage;
    const requireMap = collectIds(this.editableInEdit.requires);
    requireMap.add(this.model.id);
    const allowProfiles = this.model.isOfType('profile');
    this.searchRequireModal.open(requireMap, allowProfiles, language)
      .then((require: Require) => {
        this.editableInEdit.addRequire(require);
        this.requiresView.open(require);
      });
  }

  isRequireInUse(require: Require) {
    return this.modelController.getRequiredModels().has(require.id);
  }

  removeRequire(require: Require) {
    return this.editableInEdit.removeRequire(require);
  }

  create(model: Model) {
    return this.modelService.createModel(model);
  }

  update(model: Model, oldId: string) {
    return this.modelService.updateModel(model);
  }

  remove(model: Model): IPromise<any> {
    return this.modelService.deleteModel(model.id);
  }

  rights(): Rights {
    return {
      edit: () => true,
      remove: () => this.model.state === states.unstable
    }
  }

  getEditable(): Model {
    return this.model;
  }

  setEditable(editable: Model) {
    this.model = editable;
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }
}
