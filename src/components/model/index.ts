
import { SearchRequireModal } from './searchRequireModal';
import { SearchReferenceModal } from './searchReferenceModal';
import { AddEditRelationModal } from './addEditRelationModal';
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

mod.service('addEditRelationModal', AddEditRelationModal);
mod.service('addEditRequireModal', AddEditRequireModal);
mod.service('searchRequireModal', SearchRequireModal);
mod.service('searchReferenceModal', SearchReferenceModal);
