import { createStory, createExplicitNextCondition, createScrollWithDefault } from '../../contract';
const focusVisualizationElement = () => angular.element('class-visualization');

export const focusVisualization = createStory({
  title: 'Classes can be seen visually here',
  scroll: createScrollWithDefault(focusVisualizationElement),
  popover: {
    element: focusVisualizationElement,
    position: 'left-down'
  },
  focus: {
    element: focusVisualizationElement,
    denyInteraction: true
  },
  nextCondition: createExplicitNextCondition()
});
