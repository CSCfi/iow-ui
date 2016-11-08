import { module as mod } from './module';
import { ISCEService } from 'angular';
import { Localizable, LanguageContext } from '../../entities/contract';

mod.directive('paragraphize', () => {
  return {
    restrict: 'E',
    scope: {
      text: '=',
      context: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: ParagraphizeController,
    template: '<span ng-bind-html="ctrl.text | translateValue: ctrl.context | paragraphize"></span>'
  };
});


class ParagraphizeController {
  text: Localizable;
  context: LanguageContext;
}

mod.filter('paragraphize', /* @ngInject */ ($sce: ISCEService) => {
  return (text: string) => {
    return $sce.trustAsHtml(applyParagraph(text));
  };
});

const paragraphRegex = new RegExp(`(.*?\n\n})`);

function applyParagraph(text: string): string {
  if (!text) {
    return text;
  } else {
    return text.replace(paragraphRegex, '<p>$1</p>');
  }
}
