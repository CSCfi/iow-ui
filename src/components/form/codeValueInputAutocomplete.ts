import { module as mod }  from './module';
import { ReferenceDataService } from '../../services/referenceDataService';
import { LanguageService, Localizer } from '../../services/languageService';
import { ReferenceData, ReferenceDataCode } from '../../entities/referenceData';
import { LanguageContext } from '../../entities/contract';

mod.directive('codeValueInputAutocomplete', () => {
  return {
    restrict: 'E',
    scope: {
      referenceData: '=',
      context: '='
    },
    bindToController: true,
    transclude: true,
    template: '<autocomplete datasource="ctrl.datasource" matcher="ctrl.matcher" value-extractor="ctrl.valueExtractor" formatter="ctrl.formatter"><ng-transclude></ng-transclude></autocomplete>',
    controller: UriInputAutocompleteController,
    controllerAs: 'ctrl'
  };
});

export class UriInputAutocompleteController {

  referenceData: ReferenceData[];
  context: LanguageContext;
  localizer: Localizer;

  constructor(private referenceDataService: ReferenceDataService, languageService: LanguageService) {
    this.localizer = languageService.createLocalizer(this.context);
  }

  datasource = () => this.referenceDataService.getReferenceDataCodes(this.referenceData);

  formatter = (codeValue: ReferenceDataCode) => `${this.localizer.translate(codeValue.title)} (${codeValue.identifier})`;

  valueExtractor = (codeValue: ReferenceDataCode) => codeValue.identifier;
}
