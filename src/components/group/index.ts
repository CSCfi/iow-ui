import { GroupController } from './groupController';
import { AddModelModal } from './addModelModal';

const mod = angular.module('iow.components.group', ['iow.components.common', 'iow.components.form']);
export = mod.name;

mod.controller('groupController', GroupController);
mod.service('addModelModal', AddModelModal);
