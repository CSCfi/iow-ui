import { EditableController } from './editableController';

const mod = angular.module('iow.components.form', ['iow.services']);
export = mod.name;

import './editable';
import './editableButtons';
import './idInput';
import './localizedInput';
import './modelLanguageChooser';
import './nonEditable';
import './stateSelect';
import './valueSelect';

mod.service('editableController', EditableController);
