import { createClickNextCondition, createStory, createModifyingClickNextCondition } from '../../contract';
import { modelView, child } from '../../selectors';
import { KnownModelType } from '../../../entities/type';

function modifyModel(type: KnownModelType) {

  const modifyModelElement = child(modelView, 'button.edit');
  return createStory({

    popoverTo: modifyModelElement,
    focusTo: { element: modifyModelElement },
    popoverPosition: 'left',
    title: 'Modify ' + type,
    content: 'Diipadaa',
    nextCondition: createModifyingClickNextCondition(modifyModelElement)
  });
}

export const modifyLibrary = modifyModel('library');
export const modifyProfile = modifyModel('profile');

const requireNamespaceElement = child(modelView, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  popoverTo: requireNamespaceElement,
  focusTo: { element: requireNamespaceElement },
  popoverPosition: 'left',
  title: 'Add reference to namespace',
  content: 'Diipadaa',
  nextCondition: createClickNextCondition(requireNamespaceElement)
});


const saveModelChangesElement = child(modelView, 'button.save');
export const saveModelChanges = createStory({

  popoverTo: saveModelChangesElement,
  focusTo: { element: saveModelChangesElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(saveModelChangesElement)
});
