import _ = require('lodash');
import ILogService = angular.ILogService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { EditableController, EditableScope, EditableForm, Rights } from '../form/editableController';
import { LanguageService } from '../../services/languageService';
import { Model, Require, Reference, Uri } from '../../services/entities';
import { ModelController } from './modelController';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { collectIds } from '../../services/utils';
import { SearchSchemeModal } from './searchSchemeModal';
import { SearchRequireModal } from './searchRequireModal';
import { ConfirmationModal } from '../common/confirmationModal';

export const mod = angular.module('iow.components.model');

mod.directive('modelView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['modelView', '^ngController'],
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller: ModelViewController
  };
});

interface View<T> {
  open(item: T): void;
}

export class ModelViewController extends EditableController<Model> {

  visible: boolean = false;
  model: Model;
  private referencesView: View<Reference>;
  private requiresView: View<Require>;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              private modelService: ModelService,
              confirmationModal: ConfirmationModal,
              private searchSchemeModal: SearchSchemeModal,
              private searchRequireModal: SearchRequireModal,
              private languageService: LanguageService,
              private userService: UserService) {
    super($scope, $log, confirmationModal, userService);

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
    const vocabularyMap = collectIds(this.editableInEdit.references);
    this.searchSchemeModal.open(vocabularyMap, language)
      .then((scheme: any) => this.modelService.newReference(scheme, language))
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
    this.searchRequireModal.open(requireMap, language)
      .then((require: Require) => {
        this.editableInEdit.addRequire(require);
        this.requiresView.open(require);
      });
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
    throw new Error('Cannot remove');
  }

  rights(): Rights {
    return {
      edit: () => this.userService.isLoggedIn(),
      remove: () => false
    }
  }

  getEditable(): Model {
    return this.model;
  }

  setEditable(editable: Model) {
    this.model = editable;
  }
}
