import { SearchClassType, WithId, WithDefinedBy, WithIdAndType } from '../components/contracts';
import { containsAny, arraysAreEqual, first } from './array';
import { ClassListItem, Model } from '../services/entities';
import { collectIds } from './entity';
import { Uri } from '../services/uri';
import { IPromise, IQService } from 'angular';
import { DataSource } from '../components/form/dataSource';

export function idExclusion<T extends { id: Uri }>(excludeId: (id: Uri) => string,
                                                   excludeItem: (item: T) => string,
                                                   dataSource: DataSource<T>,
                                                   $q: IQService): (itemOrId: Uri|T) => IPromise<string> {
  return (id: Uri) => {

    if (!id) {
      return $q.when(null);
    }

    const excludeIdReason = excludeId && excludeId(id);

    if (excludeIdReason) {
      return $q.when(excludeIdReason);
    } else if (excludeItem) {
      return dataSource(id.toString()).then(items => {
        const item = first(items, item => item.id.equals(id));
        return item && excludeItem(item);
      });
    } else {
      return $q.when(null);
    }
  };
}

export function itemExclusion<T extends { id: Uri }>(excludeId: (id: Uri) => string,
                                                     excludeItem: (item: T) => string) {

  return (item: T) => {
    return item && (excludeId && excludeId(item.id)) || (excludeItem && excludeItem(item));
  };
}


export function combineExclusions<T>(...excludes: ((item: T) => string)[]) {
  return (item: T) => {
    for (const exclude of excludes) {
      const result = exclude(item);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

export function createSelfExclusion(self: WithIdAndType) {
  return (item: WithIdAndType) => {
    if (arraysAreEqual(self.type, item.type) && self.id.equals(item.id)) {
      return 'Self reference not allowed';
    } else {
      return null;
    }
  };
}

export function createDefinedByExclusion(model: Model) {

  const modelIds = collectIds(model.namespaces);
  modelIds.add(model.id.uri);

  return (item: WithDefinedBy) => {
    if (!modelIds.has(item.definedBy.id.uri)) {
      return 'Not imported by model';
    } else {
      return null;
    }
  };
}

export function createExistsExclusion(itemIds: Set<string>) {
  return (item: WithId) => {
    if (itemIds.has(item.id.toString())) {
      return 'Already added';
    } else {
      return null;
    }
  };
}

export function createClassTypeExclusion(searchClassType: SearchClassType) {

  const showShapes = containsAny([SearchClassType.Shape, SearchClassType.SpecializedClass], [searchClassType]);
  const showClasses = containsAny([SearchClassType.Class, SearchClassType.SpecializedClass], [searchClassType]);

  return (klass: ClassListItem) => {
    if (!showShapes && klass.isOfType('shape')) {
      return 'Shapes are not allowed';
    } else if (!showClasses && !klass.isOfType('shape')) {
      return 'Classes are not allowed';
    } else if (searchClassType === SearchClassType.SpecializedClass && !klass.isSpecializedClass()) {
      return 'Non specialized classes are not allowed';
    } else {
      return <string> null;
    }
  };
}
