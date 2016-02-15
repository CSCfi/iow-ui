
import { SearchRequireModal } from './searchRequireModal';
import { SearchSchemeModal } from './searchSchemeModal';
import { AddRequireModal } from './addRequireModal';

const mod = angular.module('iow.components.model', ['iow.components.editor']);
export = mod.name;

import './editableRootClass';
import './model';
import './modelForm';
import './modelView';
import './referencesView';
import './requiresView';

mod.service('addRequireModal', AddRequireModal);
mod.service('searchRequireModal', SearchRequireModal);
mod.service('searchSchemeModal', SearchSchemeModal);

