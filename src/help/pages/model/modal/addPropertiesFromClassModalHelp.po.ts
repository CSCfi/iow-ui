import { createStory, createExpectedStateNextCondition } from '../../../contract';
import { modalBody, child, modal } from '../../../selectors';
import { confirm } from '../../modal/modalHelp.po';
import { AddPropertiesFromClassModalController } from '../../../../components/editor/addPropertiesFromClassModal';
import { arraysAreEqual, any, removeMatching } from '../../../../utils/array';
import { getModalController } from '../../../utils';

const selectPropertiesElement = modalBody;

// XXX: api returns interesting {uuid}-{uuid} for which only first ui is stabile
const propertyIdIsSame = (l: string, r: string) => l.indexOf(r) !== -1 || r.indexOf(l) !== -1;

export function selectProperties(title: string, expectProperties?: string[]) {

  return createStory({

    title: title,
    content: 'Diipadaa',
    popover: {
      element: selectPropertiesElement,
      position: 'left-down'
    },
    focus: { element: selectPropertiesElement },
    nextCondition: createExpectedStateNextCondition(() => {

      const ctrl = getModalController<AddPropertiesFromClassModalController>();

      if (!expectProperties) {
        return true;
      }

      return arraysAreEqual(Object.values(ctrl.selectedProperties.map(p => p.internalId.uuid)), expectProperties, propertyIdIsSame);
    }),
    initialize: () => {
      if (expectProperties) {
        const ctrl = getModalController<AddPropertiesFromClassModalController>();
        removeMatching(ctrl.selectedProperties, property => !any(expectProperties, uuid => propertyIdIsSame(uuid, property.internalId.uuid)));
      }
    }
  });
}

export function confirmProperties(navigates: boolean) {
  return confirm(child(modal, '.add-properties-from-class'), navigates);
}
