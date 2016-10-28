import { module as mod }  from './module';
export default mod.name;

import { ClassService, DefaultClassService } from './classService';
import { VocabularyService, DefaultVocabularyService } from './vocabularyService';
import { GroupService } from './groupService';
import { LanguageService } from './languageService';
import { LocationService } from './locationService';
import { DefaultModelService, ModelService } from './modelService';
import { DefaultVisualizationService, VisualizationService } from './visualizationService';
import { ReferenceDataService } from './referenceDataService';
import { PredicateService, DefaultPredicateService } from './predicateService';
import { SearchService } from './searchService';
import { UsageService } from './usageService';
import { UserService, DefaultUserService } from './userService';
import { DefaultValidatorService, ValidatorService } from './validatorService';
import { HistoryService } from './historyService';
import { EntityLoaderService } from './entityLoader';
import { ResetService } from './resetService';
import { SessionService } from './sessionService';
import { FrameService } from './frameService';
import { proxyToInstance } from '../utils/proxy';
import { InteractiveHelpService } from '../help/services/interactiveHelpService';
import { InteractiveHelpValidatorService } from '../help/services/helpValidatorService';

function proxyConditionallyToHelp<T>(interactiveHelpService: InteractiveHelpService, defaultService: T, helpService: T) {
  return proxyToInstance(() => interactiveHelpService.open ? helpService : defaultService);
}

mod.service('defaultClassService', DefaultClassService);
mod.factory('classService', (interactiveHelpService: InteractiveHelpService, defaultClassService: ClassService, helpClassService: ClassService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultClassService, helpClassService));

mod.service('defaultVocabularyService', DefaultVocabularyService);
mod.factory('vocabularyService', (interactiveHelpService: InteractiveHelpService, defaultVocabularyService: VocabularyService, helpVocabularyService: VocabularyService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultVocabularyService, helpVocabularyService));

mod.service('groupService', GroupService);
mod.service('languageService', LanguageService);
mod.service('locationService', LocationService);

mod.service('defaultModelService', DefaultModelService);
mod.factory('modelService', (interactiveHelpService: InteractiveHelpService, defaultModelService: ModelService, helpModelService: ModelService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultModelService, helpModelService));

mod.service('defaultVisualizationService', DefaultVisualizationService);
mod.factory('visualizationService', (interactiveHelpService: InteractiveHelpService, defaultVisualizationService: VisualizationService, helpVisualizationService: VisualizationService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultVisualizationService, helpVisualizationService));

mod.service('referenceDataService', ReferenceDataService);

mod.service('defaultPredicateService', DefaultPredicateService);
mod.factory('predicateService', (interactiveHelpService: InteractiveHelpService, defaultPredicateService: PredicateService, helpPredicateService: PredicateService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultPredicateService, helpPredicateService));

mod.service('searchService', SearchService);
mod.service('usageService', UsageService);

mod.service('defaultUserService', DefaultUserService);
mod.factory('userService', (interactiveHelpService: InteractiveHelpService, defaultUserService: UserService, helpUserService: UserService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultUserService, helpUserService));

mod.service('defaultValidatorService', DefaultValidatorService);
mod.service('validatorService', (interactiveHelpService: InteractiveHelpService, defaultValidatorService: ValidatorService, helpValidatorService: InteractiveHelpValidatorService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultValidatorService, helpValidatorService));

mod.service('historyService', HistoryService);
mod.service('resetService', ResetService);
mod.service('entityLoaderService', EntityLoaderService);
mod.service('sessionService', SessionService);
mod.service('frameService', FrameService);
