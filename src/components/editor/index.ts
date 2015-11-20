import { SearchConceptModal } from './searchConceptModal';
import { SearchClassModal } from './searchClassModal';
import { SearchPredicateModal } from './searchPredicateModal';
import { AddConceptModal } from './addConceptModal';

const mod = angular.module('iow.components.editor', ['iow.components.common', 'iow.components.form']);
export = mod.name;

import './classForm';
import './classSelect';
import './classView';
import './classVisualization';
import './editableSubjectSelect';
import './predicateForm';
import './predicateSelect';
import './predicateView';
import './predicateVisualization';
import './propertyView';
import './rangeSelect';
import './selectionView';

mod.service('addConceptModal', AddConceptModal);
mod.service('searchClassModal', SearchClassModal);
mod.service('searchConceptModal', SearchConceptModal);
mod.service('searchPredicateModal', SearchPredicateModal);
