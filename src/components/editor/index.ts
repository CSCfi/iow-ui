import { SearchConceptModal } from './searchConceptModal';
import { SearchClassModal } from './searchClassModal';
import { SearchPredicateModal } from './searchPredicateModal';
import { AddConceptModal } from './addConceptModal';
import { AddPropertiesFromSuperClassModal } from './addPropertiesFromSuperClassModal';

const mod = angular.module('iow.components.editor', ['iow.components.common', 'iow.components.form']);
export = mod.name;

import './classForm';
import './classView';
import './classVisualization';
import './curieSelect';
import './editableMultipleCurieSelect';
import './editableSubjectSelect';
import './predicateForm';
import './predicateView';
import './propertyView';
import './rangeSelect';
import './selectionView';

mod.service('addConceptModal', AddConceptModal);
mod.service('addPropertiesFromSuperClassModal', AddPropertiesFromSuperClassModal);
mod.service('searchClassModal', SearchClassModal);
mod.service('searchConceptModal', SearchConceptModal);
mod.service('searchPredicateModal', SearchPredicateModal);
