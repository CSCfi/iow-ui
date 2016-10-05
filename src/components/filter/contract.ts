import { Localizable } from '../../services/entities';
import { AddNew } from '../common/searchResults';
import { all, limit } from '../../utils/array';

const defaultSearchLimit = 100;

export function applyFilters<T>(searchResults: T[], filters: SearchFilter<T>[], limitResults = defaultSearchLimit) {
  return limit(searchResults.filter(results => all(filters, filter => filter(results))), limitResults);
}

export interface SearchController<T> {
  addFilter(filter: SearchFilter<T>): void;
  search(): void;
  items: T[];
  searchResults: (AddNew|T)[];
}

export interface SearchFilter<T> {
  (item: T): boolean;
}

export interface ContentExtractor<T> {
  (item: T): Localizable|string;
}
