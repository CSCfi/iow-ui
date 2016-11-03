import { IPromise, IQService } from 'angular';
import { Model } from '../../entities/model';
import { Uri, Url } from '../../entities/uri';
import { flatten } from '../../utils/array';
import { DefinedBy } from '../../entities/definedBy';
import { Optional } from '../../utils/object';

type ModelId = string;
type ResourceId = string;
type ResourceEntry<T> = [ResourceId, T];

export class ResourceStore<T extends { id: Uri }> {

  resources = new Map<ResourceId, T>();

  values(): T[] {
    return Array.from(this.resources.values());
  }

  entries(): [ResourceId, T][] {
    return Array.from(this.resources.entries());
  }

  get(id: ResourceId): T|undefined {
    return this.resources.get(id);
  }

  add(resource: T) {
    this.resources.set(resource.id.uri, resource);
  }

  delete(id: ResourceId): boolean {
    return this.resources.delete(id);
  }

  findFirst(predicate: (item: T) => boolean): Optional<T> {
    return Array.from(this.resources.values()).find(predicate);
  }

  findAll(predicate: (item: T) => boolean): T[] {
    return Array.from(this.resources.values()).filter(predicate);
  }

  clear() {
    this.resources.clear();
  }
}

export class ModelResourceStore<T extends { id: Uri }> {

  resources = new Map<ModelId, ResourceStore<T>>();
  assignedResources = new Map<ModelId, Set<ResourceId>>();

  constructor(private $q: IQService, private fetchFallback: (id: ResourceId, model: Model) => IPromise<T>) {
  }

  getResourcesForAllModels(): Map<ResourceId, T> {
    return ModelResourceStore.createMapFromEntries(this.getAllResourceEntries());
  }

  getResourceValuesForAllModels(): T[] {
    return Array.from(this.getResourcesForAllModels().values());
  }

  private getAllResourceEntries(): ResourceEntry<T>[] {
    return flatten(Array.from(this.resources.values()).map(s => s.entries()));
  }

  getResourcesForModel(model: Model|DefinedBy): ResourceStore<T> {
    let store = this.resources.get(model.id.uri);

    if (!store) {
      store = new ResourceStore<T>();
      this.resources.set(model.id.uri, store);
    }

    return store;
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
      .then((fallbackResources: T[]) => ModelResourceStore.createMapFromEntries(linkedResourcesFromStore.entries(), fallbackResources.map(wrapAsEntry)));
  }

  getAssignedResourceValuesForModel(model: Model): IPromise<T[]> {
    return this.getAssignedResourcesForModel(model).then(resources => Array.from(resources.values()));
  }

  getAllResourcesForModel(model: Model): IPromise<Map<ResourceId, T>> {
    return this.getAssignedResourcesForModel(model)
      .then(assignedResources => ModelResourceStore.createMapFromEntries(assignedResources.entries(), this.getResourcesForModel(model).entries()));
  }

  getAllResourceValuesForModel(model: Model): IPromise<T[]> {
    return this.getAllResourcesForModel(model).then(resources => Array.from(resources.values()));
  }

  getResourceForModelById(model: Model, id: Uri|Url): IPromise<T|undefined> {
    return this.getAllResourcesForModel(model).then(resources => resources.get(id.toString()));
  }

  getResourceForAnyModelById(id: Uri|Url): T|undefined {
    return this.getResourcesForAllModels().get(id.toString());
  }

  assignResourceToModel(model: Model|DefinedBy, id: ResourceId) {
    this.getAssignedResourcesIdsForModel(model).add(id);
  }

  addResourceToModel(model: Model|DefinedBy, resource: T) {
    this.getResourcesForModel(model).add(resource);
  }

  updateResourceInModel(model: Model|DefinedBy, resource: T, originalId: ResourceId) {
    this.deleteResourceFromModel(model, originalId);
    this.getResourcesForModel(model).add(resource);
  }

  deleteResourceFromModel(model: Model|DefinedBy, resourceId: ResourceId) {
    this.getResourcesForModel(model).delete(resourceId);
    this.getAssignedResourcesIdsForModel(model).delete(resourceId);
  }

  private static createMapFromEntries<V>(...entries: Iterable<ResourceEntry<V>>[]): Map<ResourceId, V> {
    return new Map<ResourceId, V>(flatten(entries.map(e => Array.from(e))));
  }

  clear() {
    this.resources.clear();
    this.assignedResources.clear();
  }
}
