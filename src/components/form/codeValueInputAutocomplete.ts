import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IRepeatScope = angular.IRepeatScope;
import IModelFormatter = angular.IModelFormatter;
import IQService = angular.IQService;
import { CodeScheme, CodeValue, LanguageContext } from '../../services/entities';
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
    template: '<autocomplete fetch-data="ctrl.fetchData" matches="ctrl.matches" property-extractor="ctrl.propertyExtractor" formatter="ctrl.formatter"><ng-transclude></ng-transclude></autocomplete>',
    controller: UriInputAutocompleteController,
    controllerAs: 'ctrl'
  };
});

export class UriInputAutocompleteController {

  codeScheme: CodeScheme;
  context: LanguageContext;
  localizer: Localizer;

  constructor(private $q: IQService, private modelService: ModelService, private languageService: LanguageService) {
    this.localizer = languageService.createLocalizer(this.context);
  }

  fetchData = () => this.codeScheme && !this.codeScheme.isExternal() ? this.modelService.getCodeValues(this.codeScheme) : this.$q.when([]);

  formatter = (codeValue: CodeValue) => `${this.localizer.translate(codeValue.title)} (${codeValue.identifier})`;

  matches = (search: string, item: CodeScheme) => _.contains(this.formatter(item).toLowerCase(), search.toLowerCase());

  propertyExtractor = (item: CodeValue) => item.identifier;
}
