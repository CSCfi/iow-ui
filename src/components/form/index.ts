import { DisplayItemFactory } from './displayItemFactory';

import { module as mod }  from './module';
export default mod.name;

import './stringInput';
import './prefixInput';
import './namespaceInput';
import './dataTypeInput';
import './bootstrapInput';
import './uriInput';
import './editable';
import './editableLabel';
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
import './localizedSelect';
import './maxInput';
import './minInput';
import './ignoreDirty';

mod.service('displayItemFactory', DisplayItemFactory);
