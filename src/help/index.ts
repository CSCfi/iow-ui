import { module as mod }  from './module';
export default mod.name;

import { InteractiveHelpService } from './services/interactiveHelpService';
import { InteractiveHelpModelService } from './services/helpModelService';
import { InteractiveHelpUserService } from './services/helpUserService';
import { InteractiveHelpVisualizationService } from './services/helpVisualizationService';

import { FrontPageHelpService } from './frontPageHelp';
import { GroupPageHelpService } from './groupPageHelp';
import { ModelPageHelpService } from './modelPageHelp';

import { InteractiveHelpDisplay } from './components/interactiveHelpDisplay';

mod.service('interactiveHelpService', InteractiveHelpService);
mod.service('helpModelService', InteractiveHelpModelService);
mod.service('helpVisualizationService', InteractiveHelpVisualizationService);
mod.service('helpUserService', InteractiveHelpUserService);

mod.service('frontPageHelpService', FrontPageHelpService);
mod.service('groupPageHelpService', GroupPageHelpService);
mod.service('modelPageHelpService', ModelPageHelpService);

mod.service('interactiveHelpDisplay', InteractiveHelpDisplay);
