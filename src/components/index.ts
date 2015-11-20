import { FrontPageController } from './frontPageController';
import { AdvancedSearchModal } from './advancedSearchModal';

const mod = angular.module('iow.components', ['iow.services']);
export = mod.name;

mod.controller('frontPageController', FrontPageController);
mod.service('advancedSearchModal', AdvancedSearchModal);
