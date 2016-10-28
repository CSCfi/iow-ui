import { module as mod }  from './module';
export default mod.name;

import { InteractiveHelpService } from './services/interactiveHelpService';
import { InteractiveHelpModelService } from './services/helpModelService';
import { InteractiveHelpClassService } from './services/helpClassService';
import { InteractiveHelpPredicateService } from './services/helpPredicateService';
import { InteractiveHelpUserService } from './services/helpUserService';
import { InteractiveHelpVocabularyService } from './services/helpVocabularyService';
import { InteractiveHelpVisualizationService } from './services/helpVisualizationService';
import { InteractiveHelpValidatorService } from './services/helpValidatorService';

import { FrontPageHelpService } from './frontPageHelp';
import { GroupPageHelpService } from './groupPageHelp';
import { ModelPageHelpService } from './modelPageHelp';

import { InteractiveHelpDisplay } from './components/interactiveHelpDisplay';

mod.service('interactiveHelpService', InteractiveHelpService);
mod.service('helpModelService', InteractiveHelpModelService);
mod.service('helpClassService', InteractiveHelpClassService);
mod.service('helpPredicateService', InteractiveHelpPredicateService);
mod.service('helpUserService', InteractiveHelpUserService);
mod.service('helpVocabularyService', InteractiveHelpVocabularyService);
mod.service('helpVisualizationService', InteractiveHelpVisualizationService);
mod.service('helpValidatorService', InteractiveHelpValidatorService);

mod.service('frontPageHelpService', FrontPageHelpService);
mod.service('groupPageHelpService', GroupPageHelpService);
mod.service('modelPageHelpService', ModelPageHelpService);

mod.service('interactiveHelpDisplay', InteractiveHelpDisplay);
