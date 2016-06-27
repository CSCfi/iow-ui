import _ = require('lodash');
import ILogService = angular.ILogService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { GroupListItem, Model, LanguageContext } from '../../services/entities';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelController } from './model';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';

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

export class ModelViewController extends EditableEntityController<Model> {

  visible: boolean = false;
  model: Model;
  modelController: ModelController;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              private modelService: ModelService,
              deleteConfirmationModal: DeleteConfirmationModal,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);

    this.modelController.registerView(this);

    $scope.$watch(() => this.isEditing(), editing => {
      if (editing) {
        this.visible = true;
      }
    });
  }

  create(model: Model) {
    return this.modelService.createModel(model);
  }

  update(model: Model, oldEntity: Model) {
    return this.modelService.updateModel(model);
  }

  remove(model: Model): IPromise<any> {
    return this.modelService.deleteModel(model.id);
  }

  rights(): Rights {
    return {
      edit: () => this.belongToGroup(),
      remove: () => this.belongToGroup() && this.model.state === 'Unstable'
    };
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

  belongToGroup(): boolean {
    return this.userService.user.isMemberOf(this.getGroup());
  }

  canAskForRights(): boolean {
    return this.userService.isLoggedIn() && !this.belongToGroup();
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
