import { AdvancedSearchModal } from './advancedSearchModal';
import { MaintenanceModal } from './maintenance';

import { module as mod }  from './module';
export default mod.name;

import './application';
import './frontPage';
import './footer';
import './googleAnalytics';
import './maintenance';

mod.service('advancedSearchModal', AdvancedSearchModal);
mod.service('maintenanceModal', MaintenanceModal);
