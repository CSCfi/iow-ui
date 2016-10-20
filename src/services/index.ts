import { IPromise } from 'angular';
import { ClassService } from './classService';
import { VocabularyService } from './vocabularyService';
import { GroupService } from './groupService';
import { LanguageService } from './languageService';
import { LocationService } from './locationService';
import { DefaultModelService, InteractiveHelpModelService, ModelService } from './modelService';
import { DefaultVisualizationService, InteractiveHelpVisualizationService, VisualizationService } from './visualizationService';
import { ReferenceDataService } from './referenceDataService';
import { PredicateService } from './predicateService';
import { SearchService } from './searchService';
import { UsageService } from './usageService';
import { UserService, DefaultUserService, InteractiveHelpUserService } from './userService';
import { ValidatorService } from './validatorService';
import { HistoryService } from './historyService';
import { EntityLoaderService } from './entityLoader';
import { ResetService } from './resetService';
import { SessionService } from './sessionService';
import { FrameService } from './frameService';
import { InteractiveHelpService } from './interactiveHelpService';
import { proxyToInstance } from '../utils/proxy';

import { module as mod }  from './module';
export default mod.name;

export interface ResetableService {
  reset(): IPromise<any>;
}

function proxyConditionallyToHelp<T>(interactiveHelpService: InteractiveHelpService, defaultService: T, helpService: T) {
  return proxyToInstance(() => interactiveHelpService.open ? helpService : defaultService);
}

mod.service('classService', ClassService);
mod.service('vocabularyService', VocabularyService);
mod.service('groupService', GroupService);
mod.service('languageService', LanguageService);
mod.service('locationService', LocationService);

mod.service('defaultModelService', DefaultModelService);
mod.service('helpModelService', InteractiveHelpModelService);
mod.factory('modelService', (interactiveHelpService: InteractiveHelpService, defaultModelService: ModelService, helpModelService: ModelService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultModelService, helpModelService));

mod.service('defaultVisualizationService', DefaultVisualizationService);
mod.service('helpVisualizationService', InteractiveHelpVisualizationService);
mod.factory('visualizationService', (interactiveHelpService: InteractiveHelpService, defaultVisualizationService: VisualizationService, helpVisualizationService: VisualizationService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultVisualizationService, helpVisualizationService));

mod.service('referenceDataService', ReferenceDataService);
mod.service('predicateService', PredicateService);
mod.service('searchService', SearchService);
mod.service('usageService', UsageService);

mod.service('defaultUserService', DefaultUserService);
mod.service('helpUserService', InteractiveHelpUserService);
mod.factory('userService', (interactiveHelpService: InteractiveHelpService, defaultUserService: UserService, helpUserService: UserService) =>
  proxyConditionallyToHelp(interactiveHelpService, defaultUserService, helpUserService));

mod.service('validatorService', ValidatorService);
mod.service('historyService', HistoryService);
mod.service('resetService', ResetService);
mod.service('entityLoaderService', EntityLoaderService);
mod.service('sessionService', SessionService);
mod.service('frameService', FrameService);
mod.service('interactiveHelpService', InteractiveHelpService);
