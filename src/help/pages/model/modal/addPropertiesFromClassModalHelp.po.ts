import { createStory, createExpectedStateNextCondition, Story } from '../../../contract';
import { modalBody, child, modal } from '../../../selectors';
import { confirm } from '../../modal/modalHelp.po';
import { AddPropertiesFromClassModalController } from '../../../../components/editor/addPropertiesFromClassModal';
import { arraysAreEqual } from '../../../../utils/array';
import { getModalController, propertyIdIsSame, onlyProperties } from '../../../utils';

const selectPropertiesElement = modalBody;

export function selectProperties(title: string, expectProperties: string[]) {

  return createStory({

    title: title,
    content: title + ' info',
    popover: { element: selectPropertiesElement, position: 'left-down' },
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
        onlyProperties(ctrl.selectedProperties, expectProperties);
      }
      return true;
    },
    reversible: true
  });
}

export function confirmProperties(navigates: boolean) {
  return confirm(child(modal, '.add-properties-from-class'), navigates);
}

export function selectAndConfirmPropertiesItems(navigates: boolean, properties: string[]): Story[] {
  return [
    selectProperties('Select name and description', properties),
    confirmProperties(navigates)
  ];
}
