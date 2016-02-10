import { ModelController } from './modelController';
import { SearchRequireModal } from './searchRequireModal';
import { SearchSchemeModal } from './searchSchemeModal';
import { AddRequireModal } from './addRequireModal';
import './modelForm';
import './modelView';
import './referencesView';
import './requiresView';

const mod = angular.module('iow.components.model', ['iow.components.editor']);
export = mod.name;

mod.controller('modelController', ModelController);
mod.service('addRequireModal', AddRequireModal);
mod.service('searchRequireModal', SearchRequireModal);
mod.service('searchSchemeModal', SearchSchemeModal);

