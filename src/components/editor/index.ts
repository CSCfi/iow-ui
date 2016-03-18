import { SearchConceptModal } from './searchConceptModal';
import { SearchClassModal } from './searchClassModal';
import { SearchPredicateModal } from './searchPredicateModal';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';

const mod = angular.module('iow.components.editor', ['iow.components.common', 'iow.components.form']);
export = mod.name;

import './classForm';
import './classView';
import './classVisualization';
import './uriSelect';
import './editableConstraint';
import './editableMultipleUriSelect';
import './editableSubjectSelect';
import './predicateForm';
import './predicateView';
import './propertyView';
import './rangeSelect';
import './selectionView';
import './subjectView';
import './usage';
import './usagePanel';
import './visualizationView';

mod.service('addPropertiesFromClassModal', AddPropertiesFromClassModal);
mod.service('searchClassModal', SearchClassModal);
mod.service('searchConceptModal', SearchConceptModal);
mod.service('searchPredicateModal', SearchPredicateModal);
