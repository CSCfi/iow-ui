import { SearchClassType, WithId, WithDefinedBy, WithIdAndType } from '../components/contracts';
import { containsAny, arraysAreEqual } from './array';
import { ClassListItem, Model } from '../services/entities';
import { collectIds } from './entity';

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

  const modelIds = collectIds(model.requires);
  modelIds.add(model.id.uri);

  return (item: WithDefinedBy) => {
    if (!modelIds.has(item.definedBy.id.uri)) {
      return 'Not required by model';
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
