import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import { Model, Predicate, Class, Entity } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { ModelService } from '../../services/modelService';
import { HistoryService } from '../../services/historyService';
import { UserService } from '../../services/userService';
import { Urn } from '../../services/uri';
import { comparingDate, reversed } from '../../services/comparators';
import { containsAny } from '../../utils/array';

export class HistoryModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, resource: Class|Predicate|Model): IPromise<void> {
    return this.$uibModal.open({
      template: require('./historyModal.html'),
      size: 'adapting-medium',
      controllerAs: 'ctrl',
      controller: HistoryModalController,
      resolve: {
        model: () => model,
        resource: () => resource
      }
    }).result;
  }
};

class HistoryModalController {

  versions: Entity[];
  selectedItem: Entity;
  selection: Class|Predicate|Model;
  showAuthor: boolean;
  loading: boolean;

  /* @ngInject */
  constructor(private historyService: HistoryService,
              private classService: ClassService,
              private predicateService: PredicateService,
              private modelService: ModelService,
              private userService: UserService,
              public model: Model,
              public resource: Class|Predicate|Model) {

    this.showAuthor = userService.isLoggedIn();

    historyService.getHistory(resource.id).then(activity => {
      this.versions = activity.versions.sort(reversed(comparingDate<Entity>(version => version.createdAt)));
    });
  }

  isLoading(item: Entity) {
    return item === this.selectedItem && this.loading;
  }

  isSelected(item: Entity) {
    return this.selectedItem === item;
  }

  select(entity: Entity) {
    this.selectedItem = entity;
    this.loading = true;
    this.fetchResourceAtVersion(entity.id).then(resource => {
      this.selection = resource;
      this.loading = false;
    });
  }

  private fetchResourceAtVersion(versionId: Urn): IPromise<Class|Predicate|Model> {
    if (containsAny(this.resource.type, ['class', 'shape'])) {
      return this.classService.getClass(versionId, this.model);
    } else if (containsAny(this.resource.type, ['attribute', 'association'])) {
      return this.predicateService.getPredicate(versionId);
    } else if (containsAny(this.resource.type, ['model', 'profile', 'library'])) {
      return this.modelService.getModelByUrn(versionId);
    } else {
      throw new Error('Unsupported type: ' + this.resource.type);
    }
  }
}
