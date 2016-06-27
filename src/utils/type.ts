import { Type } from '../services/entities';
import { contains, containsAny, findFirstMatching } from './array';

export function normalizeSelectionType(types: Type[]): Type {
  if (containsAny(types, ['class', 'shape'])) {
    return 'class';
  } else if (contains(types, 'attribute')) {
    return 'attribute';
  } else if (contains(types, 'association')) {
    return 'association';
  } else if (containsAny(types, ['model', 'profile', 'library'])) {
    return 'model';
  } else if (contains(types, 'property')) {
    return null;
  } else {
    throw new Error('Unsupported selection type: ' + types.join());
  }
}

export function normalizeReferrerType(types: Type[]): Type {
  return normalizePredicateType(types) || normalizeClassType(types) || normalizeModelType(types) || normalizeGroupType(types);
}

export function normalizePredicateType(types: Type[]): Type {
  return findFirstMatching<Type>(types, ['attribute', 'association', 'property']);
}

export function normalizeClassType(types: Type[]): Type {
  return findFirstMatching<Type>(types, ['shape', 'class']);
}

export function normalizeModelType(types: Type[]): Type {
  const type = findFirstMatching<Type>(types, ['profile', 'library', 'model']);
  if (type === 'model') {
    return 'library';
  } else {
    return type;
  }
}

export function normalizeGroupType(types: Type[]): Type {
  return findFirstMatching<Type>(types, ['group']);
}
