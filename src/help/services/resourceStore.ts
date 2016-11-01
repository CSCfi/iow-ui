import { IPromise, IQService } from 'angular';
import { Model } from '../../entities/model';
import { Uri, Url } from '../../entities/uri';
import { flatten } from '../../utils/array';
import { DefinedBy } from '../../entities/definedBy';

type ModelId = string;
type ResourceId = string;
type ResourceEntry<T> = [ResourceId, T];

export class ResourceStore<T extends { id: Uri }> {

  resources = new Map<ModelId, Map<ResourceId, T>>();
  assignedResources = new Map<ModelId, Set<ResourceId>>();

  constructor(private $q: IQService, private fetchFallback: (id: ResourceId, model: Model) => IPromise<T>) {
  }

  getResourcesForAllModels(): Map<ResourceId, T> {
    return ResourceStore.createMapFromEntries(this.getAllResourceEntries());
  }

  getResourceValuesForAllModels(): T[] {
    return Array.from(this.getResourcesForAllModels().values());
  }

  private getAllResourceEntries(): ResourceEntry<T>[] {
    return flatten(Array.from(this.resources.values()).map(m => Array.from(m.entries())));
  }

  getResourcesForModel(model: Model|DefinedBy): Map<ResourceId, T> {
    const resourceMap = this.resources.get(model.id.uri);

    if (!resourceMap) {
      const newMap = new Map<ResourceId, T>();
      this.resources.set(model.id.uri, newMap);
      return newMap;
    } else {
      return resourceMap;
    }
  }

  getResourceValuesForModel(model: Model|DefinedBy): T[] {
    return Array.from(this.getResourcesForModel(model).values());
  }

  getAssignedResourcesIdsForModel(model: Model|DefinedBy): Set<ResourceId> {
    const resourceSet = this.assignedResources.get(model.id.uri);

    if (!resourceSet) {
      const newSet = new Set<ResourceId>();
      this.assignedResources.set(model.id.uri, newSet);
      return newSet;
    } else {
      return resourceSet;
    }
  }

  getAssignedResourcesForModel(model: Model): IPromise<Map<ResourceId, T>> {

    const assignedSet = this.getAssignedResourcesIdsForModel(model);
    const allResources: [ResourceId, T][] = this.getAllResourceEntries();
    const linkedResourcesFromStore = new Map<ResourceId, T>(allResources.filter(entry => assignedSet.has(entry[0])));
    const fallbackResourcePromises: IPromise<T>[] = [];

    for (const assigned of Array.from(assignedSet)) {
      if (!linkedResourcesFromStore.has(assigned)) {
        fallbackResourcePromises.push(this.fetchFallback(assigned, model));
      }
    }

    function wrapAsEntry(resource: T): ResourceEntry<T> {
      return [resource.id.uri, resource];
    }

    return this.$q.all(fallbackResourcePromises)
      .then((fallbackResources: T[]) => ResourceStore.createMapFromEntries(linkedResourcesFromStore.entries(), fallbackResources.map(wrapAsEntry)));
  }

  getAssignedResourceValuesForModel(model: Model): IPromise<T[]> {
    return this.getAssignedResourcesForModel(model).then(resources => Array.from(resources.values()));
  }

  getAllResourcesForModel(model: Model): IPromise<Map<ResourceId, T>> {
    return this.getAssignedResourcesForModel(model)
      .then(assignedResources => ResourceStore.createMapFromEntries(assignedResources.entries(), this.getResourcesForModel(model).entries()));
  }

  getAllResourceValuesForModel(model: Model): IPromise<T[]> {
    return this.getAllResourcesForModel(model).then(resources => Array.from(resources.values()));
  }

  getResourceForModelById(model: Model, id: Uri|Url): IPromise<T|undefined> {
    return this.getAllResourcesForModel(model).then(resources => resources.get(id.toString()));
  }

  assignResourceToModel(model: Model|DefinedBy, id: ResourceId) {
    this.getAssignedResourcesIdsForModel(model).add(id);
  }

  addResourceToModel(model: Model|DefinedBy, resource: T) {
    this.getResourcesForModel(model).set(resource.id.uri, resource);
  }

  updateResourceInModel(model: Model|DefinedBy, resource: T, originalId: ResourceId) {
    this.deleteResourceFromModel(model, originalId);
    this.getResourcesForModel(model).set(resource.id.uri, resource);
  }

  deleteResourceFromModel(model: Model|DefinedBy, resourceId: ResourceId) {
    this.getResourcesForModel(model).delete(resourceId);
    this.getAssignedResourcesIdsForModel(model).delete(resourceId);
  }

  knowsModel(model: Model|DefinedBy) {
    return this.resources.has(model.id.uri) || this.assignedResources.has(model.id.uri);
  }

  private static createMapFromEntries<V>(...entries: Iterable<ResourceEntry<V>>[]): Map<ResourceId, V> {
    return new Map<ResourceId, V>(flatten(entries.map(e => Array.from(e))));
  }

  clear() {
    this.resources.clear();
    this.assignedResources.clear();
  }
}
