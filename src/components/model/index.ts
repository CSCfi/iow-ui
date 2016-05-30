
import { SearchNamespaceModal } from './searchNamespaceModal';
import { SearchVocabularyModal } from './searchVocabularyModal';
import { AddEditLinkModal } from './addEditLinkModal';
import { AddEditNamespaceModal } from './addEditNamespaceModal';
import { SearchCodeSchemeModal } from './searchCodeSchemeModal';
import { EditCodeSchemeModal } from './editCodeSchemeModal';
import { ViewCodeSchemeModal} from './viewCodeSchemeModal';
import { ConceptEditorModal } from './conceptEditorModal';
import { module as mod }  from './module';
export default mod.name;

import './editableRootClass';
import './conceptForm';
import './conceptView';
import './model';
import './modelForm';
import './modelView';
import './vocabulariesView';
import './importedNamespacesView';
import './linksView';
import './codeSchemeView';
import './codeSchemesView';
import './technicalNamespaces';

mod.service('addEditLinkModal', AddEditLinkModal);
mod.service('addEditRequireModal', AddEditNamespaceModal);
mod.service('searchRequireModal', SearchNamespaceModal);
mod.service('searchReferenceModal', SearchVocabularyModal);
mod.service('searchCodeSchemeModal', SearchCodeSchemeModal);
mod.service('editCodeSchemeModal', EditCodeSchemeModal);
mod.service('viewCodeSchemeModal', ViewCodeSchemeModal);
mod.service('conceptEditorModal', ConceptEditorModal);
