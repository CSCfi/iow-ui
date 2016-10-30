import {
  createClickNextCondition, createStory, createModifyingClickNextCondition,
  createExplicitNextCondition, createScrollNone
} from '../../contract';
import { modelView, child } from '../../selectors';
import { KnownModelType } from '../../../entities/type';

export function modifyModel(type: KnownModelType) {

  const modifyModelElement = child(modelView, 'button.edit');
  return createStory({

    title: 'Modify ' + type,
    content: 'Diipadaa',
    popover: { element: modifyModelElement, position: 'left-down' },
    focus: { element: modifyModelElement },
    nextCondition: createModifyingClickNextCondition(modifyModelElement)
  });
}

const requireNamespaceElement = child(modelView, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  title: 'Add reference to namespace',
  content: 'Diipadaa',
  popover: { element: requireNamespaceElement, position: 'left-down' },
  focus: { element: requireNamespaceElement },
  nextCondition: createClickNextCondition(requireNamespaceElement)
});


const saveModelChangesElement = child(modelView, 'button.save');
export const saveModelChanges = createStory({

  title: 'Save changes',
  content: 'Diipadaa',
  popover: { element: saveModelChangesElement, position: 'left-down' },
  focus: { element: saveModelChangesElement },
  nextCondition: createModifyingClickNextCondition(saveModelChangesElement)
});

const focusNamespacesElement = child(modelView, 'imported-namespaces-view editable-table');
export const focusNamespaces = createStory({
  title: 'Imported namespaces are here',
  scroll: createScrollNone(),
  content: 'Diipadaa',
  popover: { element: focusNamespacesElement, position: 'left-down' },
  focus: { element: focusNamespacesElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});
