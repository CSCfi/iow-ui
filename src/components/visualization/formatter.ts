import { Property, VisualizationClass } from '../../services/entities';
import { isDefined } from '../../utils/object';
import { DataType } from '../../services/dataTypes';
import { Localizer } from '../../utils/language';
import { NameType } from '../../services/sessionService';

export function formatDataTypeName(dataType: DataType, showName: NameType, localizer: Localizer) {
  switch (showName) {
    case NameType.LABEL:
      return localizer.getStringWithModelLanguageOrDefault(dataType, 'en');
    case NameType.ID:
      return dataType;
    case NameType.LOCAL_ID:
      return dataType;
    default:
      throw new Error('Unsupported show name type: ' + showName);
  }
}

export function formatClassName(klass: VisualizationClass, showName: NameType, localizer: Localizer) {
  switch (showName) {
    case NameType.LABEL:
      return localizer.translate(klass.label);
    case NameType.ID:
      return klass.scopeClass ? klass.scopeClass.compact : klass.id.compact;
    case NameType.LOCAL_ID:
      return klass.id.namespaceResolves() ? klass.id.name : klass.id.uri;
    default:
      throw new Error('Unsupported show name type: ' + showName);
  }
}

export function formatPropertyName(property: Property, showName: NameType, localizer: Localizer) {
  switch (showName) {
    case NameType.LABEL:
      return localizer.translate(property.label);
    case NameType.ID:
      return property.predicateId.compact;
    case NameType.LOCAL_ID:
      return property.externalId || property.predicateId.compact;
    default:
      throw new Error('Unsupported show name type: ' + showName);
  }
}

export function formatAssociationPropertyName(associationProperty: Property, showName: NameType, localizer: Localizer): string {
  const name = formatPropertyName(associationProperty, showName, localizer);

  if (associationProperty.stem) {
    return name + '\n' + ' {' + associationProperty.stem + '}';
  } else {
    return name;
  }
}

export function formatAttributePropertyName(attributeProperty: Property, showCardinality: boolean, showName: NameType, localizer: Localizer): string {
  const name = formatPropertyName(attributeProperty, showName, localizer);
  const range = formatDataTypeName(attributeProperty.dataType, showName, localizer);
  const cardinality = formatCardinality(attributeProperty);
  return `- ${name} : ${range}` + (showCardinality ? ` [${cardinality}]` : '');
}

export function formatCardinality(property: Property) {
  const min = property.minCount;
  const max = property.maxCount;

  if (!isDefined(min) && !isDefined(max)) {
    return '*';
  } else if (min === max) {
    return min.toString();
  } else {
    return `${min || '0'}..${max || '*'}`;
  }
}

export type ClassAttributePropertyAnnotation = { start: number, end: number, attrs: { id: string } };

export function formatAttributeNamesAndAnnotations(properties: Property[], showCardinality: boolean, showName: NameType, localizer: Localizer): [string[], ClassAttributePropertyAnnotation[]] {

  let chars = 0;
  const names: string[] = [];
  const annotations: ClassAttributePropertyAnnotation[] = [];

  for (const property of _.sortBy(properties, p => p.index)) {
    if (property.isAttribute()) {

      const propertyName = formatAttributePropertyName(property, showCardinality, showName, localizer);
      const previousChars = chars;

      chars += propertyName.length + 1;

      names.push(propertyName);
      annotations.push({
        start: previousChars,
        end: chars,
        attrs: {
          id: property.internalId.toString()
        }
      });
    }
  }

  return [names, annotations];
}
