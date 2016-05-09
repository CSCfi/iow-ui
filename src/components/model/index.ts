
import { SearchRequireModal } from './searchRequireModal';
import { SearchSchemeModal } from './searchSchemeModal';
import { AddRelationModal } from './addRelationModal';
import { AddEditRequireModal } from './addEditRequireModal';

import { module as mod }  from './module';
export default mod.name;

import './editableRootClass';
import './model';
import './modelForm';
import './modelView';
import './referencesView';
import './requiresView';
import './relationsView';
import './technicalNamespaces';

mod.service('addRelationModal', AddRelationModal);
mod.service('addEditRequireModal', AddEditRequireModal);
mod.service('searchRequireModal', SearchRequireModal);
mod.service('searchSchemeModal', SearchSchemeModal);
