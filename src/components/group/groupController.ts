import ILocationService = angular.ILocationService;
import ILogService = angular.ILogService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import { EditableController, EditableScope, Rights } from '../form/editableController';
import { AddModelModal } from './addModelModal';
import { ConfirmationModal } from '../common/confirmationModal';
import { LocationService } from '../../services/locationService';
import { GroupService } from '../../services/groupService';
import { ModelService } from '../../services/modelService';
import { UserService } from '../../services/userService';
import { Group, GroupListItem, ModelListItem, Uri} from '../../services/entities';


export class GroupController extends EditableController<Group> {

  loading: boolean = true;
  group: Group;
  models: ModelListItem[];

  /* @ngInject */
  constructor($scope: EditableScope,
              $q: IQService,
              $log: ILogService,
              private $location: ILocationService,
              private locationService: LocationService,
              private groupId: Uri,
              private groupService: GroupService,
              private modelService: ModelService,
              private userService: UserService,
              private addModelModal: AddModelModal,
              confirmationModal: ConfirmationModal) {
    super($scope, $log, confirmationModal, userService);

    $q.all({
        group: groupService.getGroup(groupId),
        models: modelService.getModelsByGroup(groupId)
      })
      .then((result: any) => {
        this.group = result.group;
        this.models = result.models;
        locationService.atGroup(this.group);
        this.loading = false;
      });
  }

  canAddModel(): boolean {
    return this.userService.isLoggedIn();
  }

  addModel() {
    this.addModelModal.open().then((result: {prefix: string, label: string}) => {
      this.$location.path('/models');
      this.$location.search({prefix: result.prefix, label: result.label, group: this.groupId});
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
}
