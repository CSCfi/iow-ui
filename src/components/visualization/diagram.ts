import * as joint from 'jointjs';
import {
  formatClassName, formatAttributeNamesAndAnnotations, formatAssociationPropertyName,
  formatCardinality, allAttributePropertyNames, allClassNames
} from './formatter';
import { NameType } from '../../services/sessionService';
import { Localizer } from '../../utils/language';
import { requireDefined } from '../../utils/object';
import { VisualizationClass } from '../../entities/visualization';
import { Property } from '../../entities/class';
import { Dimensions } from '../../entities/contract';

const zIndexAssociation = 5;
const zIndexClass = 10;

export class LinkWithoutUnusedMarkup extends joint.dia.Link {
  markup = [
    '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
    '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
    '<path class="connection-wrap" d="M 0 0 0 0"/>',
    '<g class="labels"/>',
    '<g class="marker-vertices"/>'
  ].join('');

  toolMarkup = '';
  updateModel: () => void;
}

const classMarkup = (shadow: boolean) => {
  return `<g class="rotatable ${shadow ? 'shadow' : ''}">
            <g class="scalable">
              <rect class="uml-class-name-rect"/> ${shadow ? '' : '<rect class="uml-class-attrs-rect"/>'}
            </g>
            <text class="uml-class-name-text"/> ${shadow ? '' : '<text class="uml-class-attrs-text"/>'}
          </g>`;
};

export class ShadowClass extends joint.shapes.uml.Class {
  markup = classMarkup(true);
  updateModel = () => {};
}

export class IowClassElement extends joint.shapes.uml.Class {
  markup = classMarkup(false);
  updateModel: () => void;
}

interface IowCellOptions {
  showCardinality: boolean;
  showName: NameType;
  localizer: Localizer;
}

export function createClassElement(klass: VisualizationClass, optionsProvider: () => IowCellOptions) {

  const options = optionsProvider();
  const className = formatClassName(klass, options.showName, options.localizer);
  const [propertyNames, propertyAnnotations] = formatAttributeNamesAndAnnotations(klass.properties, options.showCardinality, options.showName, options.localizer);
  const classConstructor = klass.resolved ? IowClassElement : ShadowClass;

  const classCell = new classConstructor({
    id: klass.id.uri,
    size: calculateElementDimensions(klass, options.showCardinality, options.localizer),
    name: className,
    attributes: propertyNames,
    attrs: {
      '.uml-class-name-text': {
        'ref': '.uml-class-name-rect', 'ref-y': 0.6, 'ref-x': 0.5, 'text-anchor': 'middle', 'y-alignment': 'middle'
      },
      '.uml-class-attrs-text': {
        'annotations': propertyAnnotations
      }
    },
    z: zIndexClass
  });

  classCell.updateModel = () => {
    const newOptions = optionsProvider();
    const [newPropertyNames, newPropertyAnnotations] = formatAttributeNamesAndAnnotations(klass.properties, newOptions.showCardinality, newOptions.showName, newOptions.localizer);
    const newClassName = formatClassName(klass, newOptions.showName, newOptions.localizer);
    const previousPosition = classCell.position();
    const previousSize = classCell.getBBox();
    const newSize = calculateElementDimensions(klass, newOptions.showCardinality, newOptions.localizer);
    const xd = (newSize.width - previousSize.width) / 2;
    const yd = (newSize.height - previousSize.height) / 2;
    classCell.prop('name', newClassName);
    classCell.prop('attributes', newPropertyNames);
    classCell.attr({
      '.uml-class-attrs-text': {
        'annotations': newPropertyAnnotations
      }
    });
    classCell.prop('size', newSize);
    classCell.position(previousPosition.x - xd, previousPosition.y - yd);
  };

  return classCell;
}

export function createAssociationLink(klass: VisualizationClass, association: Property, optionsProvider: () => IowCellOptions) {

  const options = optionsProvider();

  const associationCell = new LinkWithoutUnusedMarkup({
    source: { id: klass.id.uri },
    target: { id: requireDefined(association.valueClass).toString() },
    connector: { name: 'normal' },
    attrs: {
      '.marker-target': {
        d: 'M 10 0 L 0 5 L 10 10 L 3 5 z'
      }
    },
    internalId: association.internalId.uri,
    labels: [
      { position: 0.5, attrs: { text: { text: formatAssociationPropertyName(association, options.showName, options.localizer), id: association.internalId.toString() } } },
      { position: .9, attrs: { text: { text: options.showCardinality ? formatCardinality(association) : ''} } }
    ],
    z: zIndexAssociation
  });


  associationCell.updateModel = () => {
    const newOptions = optionsProvider();
    associationCell.prop('labels/0/attrs/text/text', formatAssociationPropertyName(association, newOptions.showName, newOptions.localizer));
    if (newOptions.showCardinality) {
      associationCell.prop('labels/1/attrs/text/text', formatCardinality(association));
    }
  };

  return associationCell;
}

function calculateElementDimensions(klass: VisualizationClass, showCardinality: boolean, localizer: Localizer): Dimensions {

  const attributeProperties = klass.properties.filter(p => p.isAttribute());
  const height = 12 * attributeProperties.length + 35;
  let length = 0;

  for (const className of allClassNames(klass)) {
    if (className.length > length) {
      length = className.length;
    }
  }

  for (const property of attributeProperties) {
    for (const attributePropertyName of allAttributePropertyNames(property, showCardinality, localizer)) {
      if (attributePropertyName.length > length) {
        length = attributePropertyName.length;
      }
    }
  }

  return { width: Math.max(length * 6.5, 150), height };
}
