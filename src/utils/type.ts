import { Type, ModelType, ClassType, PredicateType, GroupType } from '../services/entities';
import { findFirstMatching } from './array';

export function normalizeReferrerType(types: Type[]): Type|null {
  return normalizePredicateType(types) || normalizeClassType(types) || normalizeModelType(types) || normalizeGroupType(types);
}

export function normalizePredicateType(types: Type[]): PredicateType|null {
  return findFirstMatching<Type>(['attribute', 'association', 'property'], types) as PredicateType;
}

export function normalizeClassType(types: Type[]): ClassType|null {
  return findFirstMatching<Type>(['shape', 'class'], types) as ClassType;
}

export function normalizeModelType(types: Type[]): ModelType|null {
  const type = findFirstMatching<Type>(['profile', 'library', 'model'], types) as ModelType;
  if (type === 'model') {
    return 'library';
  } else {
    return type;
  }
}

export function normalizeGroupType(types: Type[]): GroupType|null {
  return findFirstMatching<Type>(types, ['group']) as GroupType;
}
