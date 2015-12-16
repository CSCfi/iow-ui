import { LoginModal } from './loginModal';

const mod = angular.module('iow.components.navigation', ['iow.services']);
export = mod.name;

import './breadcrumb';

mod.service('loginModal', LoginModal);
