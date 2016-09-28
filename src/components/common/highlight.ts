import { module as mod } from './module';
import { IScope, ISCEService } from 'angular';
import { Localizable, LanguageContext } from '../../services/entities';
import { LanguageService } from '../../services/languageService';

mod.directive('highlight', () => {
  return {
    restrict: 'E',
    scope: {
      text: '<',
      search: '<',
      context: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: HighlightController,
    template: '<span ng-bind-html="ctrl.localizedText | highlight: ctrl.search"></span>'
  };
});

class HighlightController {

  text: Localizable;
  search: string;
  context: LanguageContext;

  localizedText: string;

  /* @ngInject */
  constructor($scope: IScope, private languageService: LanguageService) {
    $scope.$watch(() => this.languageService.getModelLanguage(this.context), () => {
      this.localizedText = this.formatText();
    });
  }

  formatText() {

    if (!this.text) {
      return '';
    }

    const regex = createRegex(this.search);
    const primaryTranslation = this.languageService.translate(this.text, this.context);

    if (!regex.test(primaryTranslation)) {

      for (const entry of Object.entries(this.text)) {
        const language = entry[0];
        const text = entry[1];

        const match = regex.exec(text);

        if (match) {
          const matchStartIndex = match.index;
          const matchEndIndex = matchStartIndex + match[0].length;

          const excessiveThreshold = 30;
          const startIndex = Math.max(0, matchStartIndex - excessiveThreshold);
          const endIndex = Math.min(text.length, matchEndIndex + excessiveThreshold);

          let localizedText = '';

          if (startIndex > 0) {
            localizedText += '&hellip;';
          }

          localizedText += text.slice(startIndex, endIndex);

          if (endIndex < text.length) {
            localizedText += '&hellip;';
          }

          return `${primaryTranslation} [${language}: ${localizedText}]`;
        }
      }
    }

    return primaryTranslation;
  }
}

mod.filter('highlight', /* @ngInject */ ($sce: ISCEService) => {
  return (text: string, search: string) => {
    const highlightedText = applyHighlight(text, search);
    return $sce.trustAsHtml(highlightedText);
  };
});


function applyHighlight(text: string, search: string): string {
  if (!text || !search || search.length === 0) {
    return text;
  } else {
    return text.replace(createRegex(search), '<span class="highlight">$1</span>');
  }
}

let cachedRegex: { search: string, value: RegExp };

function createRegex(search: string) {

  if (!cachedRegex || cachedRegex.search !== search) {
    cachedRegex = { search, value: new RegExp('(' + sanitizeRegex(search) + ')', 'gi') };
  }

  return cachedRegex.value;
}

function sanitizeRegex(term: string) {
  return term && term.toString().replace(/[\\\^$*+?.()|{}\[\]]/g, '\\$&');
}
