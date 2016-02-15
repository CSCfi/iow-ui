import { LoginModal } from './loginModal';

const mod = angular.module('iow.components.navigation', ['iow.services']);
export = mod.name;

import './breadcrumb';
import './navigationBar';

mod.service('loginModal', LoginModal);
