import { IScope, IAttributes, ILocationService, ILogService, IPromise, IQService } from 'angular';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { AddModelModal } from './addModelModal';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { LocationService } from '../../services/locationService';
import { GroupService } from '../../services/groupService';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { Uri } from '../../entities/uri';
import { module as mod }  from './module';
import { Language } from '../../utils/language';
import { ErrorModal } from '../form/errorModal';
import { Group } from '../../entities/group';
import { ModelListItem } from '../../entities/model';
import { KnownModelType } from '../../entities/type';
import { LanguageContext } from '../../entities/contract';
import { NotificationModal } from '../common/notificationModal';
import { ApplicationController } from '../application';
import { HelpProvider } from '../common/helpProvider';
import { GroupPageHelpService } from '../../help/groupPageHelp';
import { InteractiveHelp } from '../../help/contract';
import { modalCancelHandler } from '../../utils/angular';

mod.directive('groupPage', () => {
  return {
    restrict: 'E',
    template: require('./groupPage.html'),
    controllerAs: 'ctrl',
    scope: {
      groupId: '='
    },
    bindToController: true,
    require: ['groupPage', '^application'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [ctrl, applicationController]: [GroupPageController, ApplicationController]) {
      applicationController.registerHelpProvider(ctrl);
    },
    controller: GroupPageController
  };
});

class GroupPageController extends EditableEntityController<Group> implements HelpProvider {

  loading: boolean = true;
  groupId: Uri;
  group: Group;
  models: ModelListItem[];
  profiles: ModelListItem[];
  helps: InteractiveHelp[];

  /* @ngInject */
  constructor($scope: EditableScope,
              $q: IQService,
              $log: ILogService,
              private $location: ILocationService,
              locationService: LocationService,
              groupService: GroupService,
              modelService: ModelService,
              userService: UserService,
              private addModelModal: AddModelModal,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              notificationModal: NotificationModal,
              groupPageHelpService: GroupPageHelpService) {
    super($scope, $log, deleteConfirmationModal, errorModal, notificationModal, userService);

    $scope.$watch(() => this.groupId, groupId => {
      this.loading = true;
      $q.all({
          group: groupService.getGroup(groupId),
          models: modelService.getModelsByGroup(groupId)
        })
        .then((result: {group: Group, models: ModelListItem[]}) => {
          this.group = result.group;
          this.helps = groupPageHelpService.getHelps(this.group);
          this.models = result.models.filter(model => !model.isOfType('profile'));
          this.profiles = result.models.filter(model => model.isOfType('profile'));
          locationService.atGroup(this.group);
          this.loading = false;
        }, _err => {
          notificationModal.openGroupNotFound();
        });
    });
  }

  canAddModel(): boolean {
    return this.userService.isLoggedIn() && this.belongToGroup();
  }

  addModel(type: KnownModelType) {
    this.userService.ifStillLoggedIn(() => {
        this.addModelModal.open(this.groupId, type).then((result: {prefix: string, label: string, language: Language[], redirect?: Uri}) => {
          this.$location.path('/newModel');
          this.$location.search({ prefix: result.prefix, label: result.label, language: result.language, group: this.groupId.uri, type, redirect: result.redirect && result.redirect.uri });
        }, modalCancelHandler);
      },
      () => this.notificationModal.openNotLoggedIn());
  };

  selectModel(model: ModelListItem) {
    this.$location.url(model.iowUrl());
  }

  create(_entity: Group): IPromise<any> {
    throw new Error('Not supported');
  }

  update(_entity: Group, _oldEntity: Group): IPromise<any> {
    throw new Error('Not supported');
  }

  remove(_entity: Group): IPromise<any> {
    throw new Error('Not supported');
  }

  rights(): Rights {
    return {
      edit: () => false,
      remove: () => false
    };
  }

  getEditable(): Group {
    return this.group;
  }

  setEditable(editable: Group) {
    this.group = editable;
  }

  canAskForRights(): boolean {
    return this.userService.isLoggedIn() && !this.belongToGroup();
  }

  belongToGroup(): boolean {
    return this.userService.user.isMemberOf(this.getGroup());
  }

  getGroup(): Group {
    return this.group;
  }

  getContext(): LanguageContext {
    return this.group;
  }
}
