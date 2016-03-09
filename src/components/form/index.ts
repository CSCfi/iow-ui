import { DisplayItemFactory } from './displayItemFactory';

const mod = angular.module('iow.components.form', ['iow.services']);
export = mod.name;

import './dataTypeInput';
import './bootstrapInput';
import './uriInput';
import './editable';
import './editableEntityButtons';
import './errorMessages';
import './href';
import './idInput';
import './localizedInput';
import './modelLanguageChooser';
import './nonEditable';
import './restrictDuplicates';
import './stateSelect';
import './submitErrorPanel';
import './valueSelect';
import './maxInput';
import './minInput';

mod.service('displayItemFactory', DisplayItemFactory);
