import { ChoosePredicateTypeModal } from './choosePredicateTypeModal';
import { SearchConceptModal } from './searchConceptModal';
import { SearchClassModal } from './searchClassModal';
import { SearchPredicateModal } from './searchPredicateModal';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';
import { module as mod }  from './module';
export default mod.name;

import './classForm';
import './classView';
import './classVisualization';
import './definedBy';
import './uriSelect';
import './editableConstraint';
import './editableMultiple';
import './editableMultipleUriSelect';
import './editableMultipleDataTypeInput';
import './editableMultipleLanguageSelect';
import './editableSubjectSelect';
import './editableReferenceDataSelect';
import './predicateForm';
import './predicateView';
import './propertyView';
import './rangeSelect';
import './selectionView';
import './subjectView';
import './usage';
import './usagePanel';
import './visualizationView';

mod.service('choosePredicateTypeModal', ChoosePredicateTypeModal);
mod.service('addPropertiesFromClassModal', AddPropertiesFromClassModal);
mod.service('searchClassModal', SearchClassModal);
mod.service('searchConceptModal', SearchConceptModal);
mod.service('searchPredicateModal', SearchPredicateModal);
