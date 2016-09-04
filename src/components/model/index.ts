
import { SearchNamespaceModal } from './searchNamespaceModal';
import { SearchVocabularyModal } from './searchVocabularyModal';
import { AddEditLinkModal } from './addEditLinkModal';
import { AddEditNamespaceModal } from './addEditNamespaceModal';
import { SearchReferenceDataModal } from './searchReferenceDataModal';
import { EditReferenceDataModal } from './editReferenceDataModal';
import { ViewReferenceDataModal} from './viewReferenceDataModal';
import { ConceptEditorModal } from './conceptEditorModal';
import { module as mod }  from './module';
export default mod.name;

import './editableRootClass';
import './conceptForm';
import './conceptView';
import './divider';
import './model';
import './newModel';
import './modelForm';
import './modelView';
import './vocabulariesView';
import './importedNamespacesView';
import './linksView';
import './referenceDataView';
import './referenceDatasView';
import './technicalNamespaces';

mod.service('addEditLinkModal', AddEditLinkModal);
mod.service('addEditNamespaceModal', AddEditNamespaceModal);
mod.service('searchNamespaceModal', SearchNamespaceModal);
mod.service('searchVocabularyModal', SearchVocabularyModal);
mod.service('searchReferenceDataModal', SearchReferenceDataModal);
mod.service('editReferenceDataModal', EditReferenceDataModal);
mod.service('viewReferenceDataModal', ViewReferenceDataModal);
mod.service('conceptEditorModal', ConceptEditorModal);
