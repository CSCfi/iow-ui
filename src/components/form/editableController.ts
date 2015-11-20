import _ = require('lodash');
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IFormController = angular.IFormController;
import ILogService = angular.ILogService;
import { UserService } from "../../services/userService";
import { ModelController } from "../model/modelController";
import { Class, Predicate, Model } from "../../services/entities";
import { ConfirmationModal } from "../common/confirmationModal";
import {GroupListItem} from "../../services/entities";
import {Group} from "../../services/entities";

export interface EditableForm extends IFormController {
  editing: boolean;
}

export interface EditableScope extends IScope {
  modelController: ModelController;
  form: EditableForm;
}

export type Rights = {
  edit(): boolean;
  remove(): boolean;
}

export abstract class EditableController<T extends Class|Predicate|Model|Group> {

  submitError = false;
  editableInEdit: T;

  constructor(private $scope: EditableScope, private $log: ILogService, private confirmationModal: ConfirmationModal, userService: UserService) {
    $scope.$watch(() => userService.isLoggedIn(), (isLoggedIn, wasLoggedIn) => {
      // TODO: check weird condition
      if (isLoggedIn && wasLoggedIn) {
        this.cancelEditing();
      }
    });

    $scope.$watch(() => this.getEditable(), editable => this.select(editable));
  }

  abstract create(entity: T): IPromise<any>;
  abstract update(entity: T, oldId: string): IPromise<any>;
  abstract remove(entity: T): IPromise<any>;
  abstract rights(): Rights;
  abstract getEditable(): T;
  abstract setEditable(editable: T): void;

  select(editable: T) {
    function clone(obj: any) {
      if (obj) {
        const cloned = Object.create(Object.getPrototypeOf(obj));
        _.merge(cloned, obj);
        return cloned;
      }
    }
    this.submitError = false;
    this.setEditable(editable);
    this.editableInEdit = clone(editable);

    if (editable && editable.unsaved) {
      this.edit();
    } else {
      this.cancelEditing();
    }
  }

  saveEdited() {
    const editable = this.getEditable();
    const editableInEdit = this.editableInEdit;
    this.$log.info(JSON.stringify(editableInEdit.serialize(), null, 2));

    const unsaved = editable.unsaved;
    (unsaved ? this.create(editableInEdit) : this.update(editableInEdit, editable.id))
      .then(() => {
        this.$scope.modelController.selectionEdited(editable, editableInEdit);
        this.select(editableInEdit);
      }, err => {
        this.$log.error(err);
        this.submitError = true;
      });
  }

  removeEdited() {
    const editable = this.getEditable();
    this.confirmationModal.openDeleteConfirm()
      .then(() => this.remove(editable))
      .then(() => {
        this.$scope.modelController.selectionDeleted(editable);
        this.select(null);
      });
  }

  canRemove() {
    const editable = this.getEditable();
    return editable && !editable.unsaved && !this.isEditing() && this.rights().remove();
  }

  cancelEditing() {
    if (this.isEditing()) {
      this.submitError = false;
      this.$scope.form.editing = false;
      const editable = this.getEditable();
      this.select(editable.unsaved ? null : editable);
    }
  }

  edit() {
    this.$scope.form.editing = true;
  }

  isEditing(): boolean {
    return this.$scope.form && this.$scope.form.editing;
  }

  canEdit(): boolean {
    return !this.isEditing() && this.rights().edit();
  }

  canModify(): boolean {
    return this.isEditing() && this.rights().edit();
  }
}
