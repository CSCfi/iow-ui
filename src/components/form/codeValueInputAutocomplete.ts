import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IRepeatScope = angular.IRepeatScope;
import IModelFormatter = angular.IModelFormatter;
import IQService = angular.IQService;
import { ReferenceData, CodeValue, LanguageContext } from '../../services/entities';
import { module as mod }  from './module';
import { ModelService } from '../../services/modelService';
import { LanguageService, Localizer } from '../../services/languageService';

mod.directive('codeValueInputAutocomplete', () => {
  return {
    restrict: 'E',
    scope: {
      codeScheme: '=',
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

  codeScheme: ReferenceData;
  context: LanguageContext;
  localizer: Localizer;

  constructor(private $q: IQService, private modelService: ModelService, private languageService: LanguageService) {
    this.localizer = languageService.createLocalizer(this.context);
  }

  datasource = (search: string) => this.codeScheme && !this.codeScheme.isExternal() ? this.modelService.getCodeValues(this.codeScheme) : this.$q.when([]);

  formatter = (codeValue: CodeValue) => `${this.localizer.translate(codeValue.title)} (${codeValue.identifier})`;

  valueExtractor = (codeValue: CodeValue) => codeValue.identifier;
}
