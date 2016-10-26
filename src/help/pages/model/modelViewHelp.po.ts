import { createClickNextCondition, createStory, createModifyingClickNextCondition } from '../../contract';
import { modelView, child } from '../../selectors';
import { KnownModelType } from '../../../entities/type';

export function modifyModel(type: KnownModelType) {

  const modifyModelElement = child(modelView, 'button.edit');
  return createStory({

    title: 'Modify ' + type,
    content: 'Diipadaa',
    popover: {
      element: modifyModelElement,
      position: 'left'
    },
    focus: { element: modifyModelElement },
    nextCondition: createModifyingClickNextCondition(modifyModelElement)
  });
}

export const modifyLibrary = modifyModel('library');
export const modifyProfile = modifyModel('profile');

const requireNamespaceElement = child(modelView, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  title: 'Add reference to namespace',
  content: 'Diipadaa',
  popover: {
    element: requireNamespaceElement,
    position: 'left'
  },
  focus: { element: requireNamespaceElement },
  nextCondition: createClickNextCondition(requireNamespaceElement)
});


const saveModelChangesElement = child(modelView, 'button.save');
export const saveModelChanges = createStory({

  title: 'Save changes',
  content: 'Diipadaa',
  popover: {
    element: saveModelChangesElement,
    position: 'left'
  },
  focus: { element: saveModelChangesElement },
  nextCondition: createModifyingClickNextCondition(saveModelChangesElement)
});
