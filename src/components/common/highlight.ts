import { module as mod } from './module';
import { ISCEService } from 'angular';

mod.directive('highlight', () => {
  return {
    restrict: 'E',
    scope: {
      text: '<',
      search: '<'
    },
    template: '<span ng-bind-html="text | highlight: search"></span>'
  };
});

mod.filter('highlight', /* @ngInject */ ($sce: ISCEService) => {
  return (text: string, search: string) => {
    const highlightedText = applyHighlight(text, search);
    return $sce.trustAsHtml(highlightedText);
  };
});

let cachedRegex: { search: string, value: RegExp };

function applyHighlight(text: string, search: string): string {

  if (!search || search.length === 0) {
    return text;
  } else {

    if (!cachedRegex || cachedRegex.search !== search) {
      cachedRegex = { search, value: createRegex(search, 'gi') };
    }

    return text.replace(cachedRegex.value, '<span class="highlight">$1</span>');
  }
}

function createRegex(term: string, flags: string) {
  return new RegExp('(' + sanitizeRegex(term) + ')', flags);
}

function sanitizeRegex(term: string) {
  return term && term.toString().replace(/[\\\^$*+?.()|{}\[\]]/g, '\\$&');
}
