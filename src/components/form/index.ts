import { DisplayItemFactory } from './displayItemFactory';

import { module as mod }  from './module';
export default mod.name;

import './autocomplete';
import './codeValueInput';
import './codeValueInputAutocomplete';
import './stringInput';
import './prefixInput';
import './namespaceInput';
import './dataTypeInput';
import './bootstrapInput';
import './uriInput';
import './uriInputAutocomplete';
import './editable';
import './editableLabel';
import './editableEntityButtons';
import './errorMessages';
import './href';
import './idInput';
import './localizedInput';
import './modelLanguageChooser';
import './nonEditable';
import './languageInput';
import './restrictDuplicates';
import './editableStateSelect';
import './submitErrorPanel';
import './localizedSelect';
import './maxInput';
import './minInput';
import './ignoreDirty';
import './dragSortable';
import './editableTable';
import './iowSelect';

mod.service('displayItemFactory', DisplayItemFactory);
