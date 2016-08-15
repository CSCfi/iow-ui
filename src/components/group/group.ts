import ILocationService = angular.ILocationService;
import ILogService = angular.ILogService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { AddModelModal } from './addModelModal';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { LocationService } from '../../services/locationService';
import { GroupService } from '../../services/groupService';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { Group, ModelListItem, Type, LanguageContext } from '../../services/entities';
import { MaintenanceModal } from '../maintenance';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { Language } from '../../utils/language';

mod.directive('group', () => {
  return {
    restrict: 'E',
    template: require('./group.html'),
    controllerAs: 'ctrl',
    scope: {
      groupId: '='
    },
    bindToController: true,
    controller: GroupController
  };
});

class GroupController extends EditableEntityController<Group> {

  loading: boolean = true;
  groupId: Uri;
  group: Group;
  models: ModelListItem[];
  profiles: ModelListItem[];

  /* @ngInject */
  constructor($scope: EditableScope,
              $q: IQService,
              $log: ILogService,
              private $location: ILocationService,
              private locationService: LocationService,
              private groupService: GroupService,
              private modelService: ModelService,
              userService: UserService,
              private addModelModal: AddModelModal,
              deleteConfirmationModal: DeleteConfirmationModal,
              maintenanceModal: MaintenanceModal) {
    super($scope, $log, deleteConfirmationModal, userService);

    $scope.$watch(() => this.groupId, groupId => {
      this.loading = true;
      $q.all({
          group: groupService.getGroup(groupId),
          models: modelService.getModelsByGroup(groupId)
        })
        .then((result: {group: Group, models: ModelListItem[]}) => {
          this.group = result.group;
          this.models = _.filter(result.models, model => !model.isOfType('profile'));
          this.profiles = _.filter(result.models, model => model.isOfType('profile'));
          locationService.atGroup(this.group);
          this.loading = false;
        }, err => {
          maintenanceModal.open(err);
        });
    });
  }

  canAddModel(): boolean {
    return this.userService.isLoggedIn() && this.belongToGroup();
  }

  addModel(type: Type) {
    this.addModelModal.open(this.groupId, type).then((result: {prefix: string, label: string, language: Language[]}) => {
      this.$location.path('/model');
      this.$location.search({prefix: result.prefix, label: result.label, language: result.language, group: this.groupId.uri, type});
    });
  };

  selectModel(model: ModelListItem) {
    this.$location.url(model.iowUrl(false));
  }

  create(entity: Group): IPromise<any> {
    throw new Error('Not supported');
  }

  update(entity: Group, oldEntity: Group): IPromise<any> {
    throw new Error('Not supported');
  }

  remove(entity: Group): IPromise<any> {
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
