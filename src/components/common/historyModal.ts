import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { Model, Predicate, Class, Entity, Uri, Urn } from '../../services/entities';
import { containsAny } from '../../services/utils';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { ModelService } from '../../services/modelService';
import { HistoryService } from '../../services/historyService';

export class HistoryModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, resource: Class|Predicate|Model): IPromise<void> {
    return this.$uibModal.open({
      template: require('./historyModal.html'),
      size: 'large',
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

  /* @ngInject */
  constructor(private historyService: HistoryService,
              private classService: ClassService,
              private predicateService: PredicateService,
              private modelService: ModelService,
              public model: Model,
              public resource: Class|Predicate|Model) {

    historyService.getHistory(resource.id).then(activity => {
      this.versions = activity.versions;
    });
  }

  isSelected(item: Entity) {
    return this.selectedItem == item;
  }

  select(entity: Entity) {
    this.selectedItem = entity;
    this.fetchResourceAtVersion(entity.id).then(resource => this.selection = resource);
  }

  private fetchResourceAtVersion(versionId: Urn): IPromise<Class|Predicate|Model> {
    if (containsAny(this.resource.type, ['class', 'shape'])) {
      return this.classService.getClass(versionId);
    } else if (containsAny(this.resource.type, ['attribute', 'association'])) {
      return this.predicateService.getPredicate(versionId);
    } else if (containsAny(this.resource.type, ['model', 'profile', 'library'])) {
      return this.modelService.getModelByUrn(versionId);
    } else {
      throw new Error('Unsupported type: ' + this.resource.type);
    }
  }
}
