import { AdvancedSearchModal } from './advancedSearchModal';
import { MaintenanceModal } from './maintenance';

const mod = angular.module('iow.components', ['iow.services']);
export = mod.name;

import './application';
import './frontPage';
import './footer';
import './googleAnalytics';
import './maintenance';

mod.service('advancedSearchModal', AdvancedSearchModal);
mod.service('maintenanceModal', MaintenanceModal);
