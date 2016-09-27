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
    const reducer = (result: string, token: Token) =>
      result + (token.isMatch ? `<span class="highlight">${token.text}</span>` : token.text);

    if (!cachedRegex || cachedRegex.search !== search) {
      cachedRegex = { search, value: createRegex(search, 'i') };
    }

    return resolveTokens(text, cachedRegex.value).reduce(reducer, '');
  }
}

interface Token {
  text: string;
  isMatch: boolean;
}

function resolveTokens(text: string, search: RegExp) {

  const tokens: Token[] = [];

  const addToken = (t: string, match: boolean) => {
    tokens.push({
      isMatch: match,
      text: t
    });
  };

  let t = text.slice();

  while (true) {

    const matches = t.match(search);

    if (matches && matches.length > 0) {
      const startIndex = matches.index;
      const endIndex = startIndex + matches[0].length;

      if (startIndex > 0) {
        addToken(t.slice(0, startIndex), false);
      }

      addToken(t.slice(startIndex, endIndex), true);

      t = t.substring(endIndex);
    } else {
      break;
    }
  }

  if (t.length > 0) {
    addToken(t, false);
  }

  return tokens;
}

function createRegex(term: string, flags: string) {
  return new RegExp(sanitizeRegex(term), flags);
}

function sanitizeRegex(term: string) {
  return term && term.toString().replace(/[\\\^$*+?.()|{}\[\]]/g, '\\$&');
}
