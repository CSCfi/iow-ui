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
import { Group, GroupListItem, ModelListItem, Uri, Type } from '../../services/entities';


export class GroupController extends EditableEntityController<Group> {

  loading: boolean = true;
  group: Group;
  models: ModelListItem[];
  profiles: ModelListItem[];

  /* @ngInject */
  constructor($scope: EditableScope,
              $q: IQService,
              $log: ILogService,
              private $location: ILocationService,
              private locationService: LocationService,
              private groupId: Uri,
              private groupService: GroupService,
              private modelService: ModelService,
              userService: UserService,
              private addModelModal: AddModelModal,
              deleteConfirmationModal: DeleteConfirmationModal) {
    super($scope, $log, deleteConfirmationModal, userService);

    $q.all({
        group: groupService.getGroup(groupId),
        models: modelService.getModelsByGroup(groupId)
      })
      .then((result: {group: Group, models: ModelListItem[]}) => {
        this.group = result.group;
        this.models = _.filter(result.models, model => model.type === 'model');
        this.profiles = _.filter(result.models, model => model.type === 'profile');
        locationService.atGroup(this.group);
        this.loading = false;
      });
  }

  canAddModel(): boolean {
    return this.userService.isLoggedIn() && this.belongToGroup();
  }

  addModel(type: Type) {
    this.addModelModal.open(this.groupId, type).then((result: {prefix: string, label: string}) => {
      this.$location.path('/model');
      this.$location.search({prefix: result.prefix, label: result.label, group: this.groupId, type});
    });
  };

  canAskForRights(): boolean {
    const user = this.userService.user;
    return this.group && user.isLoggedIn() && !user.isMemberOf(this.group);
  }

  selectModel(model: ModelListItem) {
    this.$location.url(model.iowUrl());
  }

  create(entity: Group): IPromise<any> {
    throw new Error('Not supported');
  }

  update(entity: Group, oldId: string): IPromise<any> {
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

  getGroup(): Group {
    return this.group;
  }
}
