import { Localizable } from '../../entities/contract';
import { Localizer } from '../../utils/language';
import { Exclusion } from '../../utils/exclusion';
import { ContentExtractor, SearchFilter, applyFilters, TextAnalysis } from './contract';
import { analyze } from './textAnalyzer';
import { comparingBoolean, comparingNumber, comparingLocalizable, Comparator } from '../../utils/comparators';

export function filterAndSortSearchResults<S>(items: S[],
                                              searchText: string,
                                              contentExtractors: ContentExtractor<S>[],
                                              filters: SearchFilter<S>[],
                                              comparator: Comparator<TextAnalysis<S>>): S[] {

  const analyzedItems = items.map(item => analyze(searchText, item, contentExtractors));
  const filteredAnalyzedItems = applyFilters(analyzedItems, filters);

  filteredAnalyzedItems.sort(comparator);

  return filteredAnalyzedItems.map(ai => ai.item);
}

export function scoreComparator<S>() {
  return comparingNumber<TextAnalysis<S>>(item => item.matchScore ? item.matchScore : item.score);
}

export function labelComparator<S extends { label: Localizable }>(localizer: Localizer) {
  return comparingLocalizable<TextAnalysis<S>>(localizer, item => item.item.label);
}

export function titleComparator<S extends { title: Localizable }>(localizer: Localizer) {
  return comparingLocalizable<TextAnalysis<S>>(localizer, item => item.item.title);
}

export function exclusionComparator<S>(exclude: Exclusion<S>) {
  return comparingBoolean<TextAnalysis<S>>(item => !!exclude(item.item));
}

export function defaultLabelComparator<S extends { label: Localizable }>(localizer: Localizer, exclude?: Exclusion<S>) {
  const comparator = scoreComparator<S>().andThen(labelComparator<S>(localizer));
  return exclude ? exclusionComparator<S>(exclude).andThen(comparator) : comparator;
}

export function defaultTitleComparator<S extends { title: Localizable }>(localizer: Localizer, exclude?: Exclusion<S>) {
  const comparator = scoreComparator<S>().andThen(titleComparator<S>(localizer));
  return exclude ? exclusionComparator<S>(exclude).andThen(comparator) : comparator;
}
