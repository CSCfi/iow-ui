import { Type } from '../services/entities';
import { findFirstMatching } from './array';

export function normalizeReferrerType(types: Type[]): Type|null {
  return normalizePredicateType(types) || normalizeClassType(types) || normalizeModelType(types) || normalizeGroupType(types);
}

export function normalizePredicateType(types: Type[]): Type|null {
  return findFirstMatching<Type>(['attribute', 'association', 'property'], types);
}

export function normalizeClassType(types: Type[]): Type|null {
  return findFirstMatching<Type>(['shape', 'class'], types);
}

export function normalizeModelType(types: Type[]): Type|null {
  const type = findFirstMatching<Type>(['profile', 'library', 'model'], types);
  if (type === 'model') {
    return 'library';
  } else {
    return type;
  }
}

export function normalizeGroupType(types: Type[]): Type|null {
  return findFirstMatching<Type>(types, ['group']);
}
