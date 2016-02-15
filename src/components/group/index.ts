import { AddModelModal } from './addModelModal';

const mod = angular.module('iow.components.group', ['iow.components.common', 'iow.components.form']);
export = mod.name;

import './group';

mod.service('addModelModal', AddModelModal);
