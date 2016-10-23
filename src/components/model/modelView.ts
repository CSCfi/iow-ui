import { ILogService, IPromise } from 'angular';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelPageController } from './modelPage';
import { module as mod }  from './module';
import { ErrorModal } from '../form/errorModal';
import { Model } from '../../entities/model';
import { GroupListItem } from '../../entities/group';
import { LanguageContext } from '../../entities/contract';
import { NotificationModal } from '../common/notificationModal';

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
  modelController: ModelPageController;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              private modelService: ModelService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              notificationModal: NotificationModal,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, errorModal, notificationModal, userService);

    if (this.modelController) {
      this.modelController.registerView(this);
    }

    $scope.$watch(() => this.isEditing(), editing => {
      if (editing) {
        this.visible = true;
      }
    });
  }

  create(model: Model) {
    return this.modelService.createModel(model);
  }

  update(model: Model, _oldEntity: Model) {
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
