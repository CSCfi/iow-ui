import { Type } from '../services/entities';
import { findFirstMatching } from './array';

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
