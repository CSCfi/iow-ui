
import { SearchRequireModal } from './searchRequireModal';
import { SearchSchemeModal } from './searchSchemeModal';
import { AddRelationModal } from './addRelationModal';
import { AddRequireModal } from './addRequireModal';

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
mod.service('addRequireModal', AddRequireModal);
mod.service('searchRequireModal', SearchRequireModal);
mod.service('searchSchemeModal', SearchSchemeModal);
