import { AdvancedSearchModal } from './advancedSearchModal';

const mod = angular.module('iow.components', ['iow.services']);
export = mod.name;

import './application';
import './frontPage';
import './footer';
import './googleAnalytics';

mod.service('advancedSearchModal', AdvancedSearchModal);
