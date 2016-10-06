import { Property, VisualizationClass } from '../../services/entities';
import { isDefined, assertNever } from '../../utils/object';
import { DataType } from '../../services/dataTypes';
import { Localizer } from '../../utils/language';
import { NameType } from '../../services/sessionService';

function formatDataTypeAsLabel(dataType: DataType|undefined, localizer: Localizer) {
  return localizer.getStringWithModelLanguageOrDefault(dataType, 'en');
}

function formatDataTypeAsId(dataType: DataType|undefined) {
  return dataType || '';
}

function formatDataTypeName(dataType: DataType|undefined, showName: NameType, localizer: Localizer) {
  switch (showName) {
    case NameType.LABEL:
      return formatDataTypeAsLabel(dataType, localizer);
    case NameType.ID:
      return formatDataTypeAsId(dataType);
    case NameType.LOCAL_ID:
      return formatDataTypeAsId(dataType);
    default:
      return assertNever(showName, 'Unsupported show name type: ' + showName);
  }
}

function formatClassNameAsLabel(klass: VisualizationClass, localizer: Localizer) {
  return localizer.translate(klass.label);
}

function formatClassNameAsId(klass: VisualizationClass) {
  return klass.scopeClass ? klass.scopeClass.compact : klass.id.compact;
}

function formatClassNameAsLocalId(klass: VisualizationClass) {
  return klass.id.namespaceResolves() ? klass.id.name : klass.id.uri;
}

export function formatClassName(klass: VisualizationClass, showName: NameType, localizer: Localizer) {
  switch (showName) {
    case NameType.LABEL:
      return formatClassNameAsLabel(klass, localizer);
    case NameType.ID:
      return formatClassNameAsId(klass);
    case NameType.LOCAL_ID:
      return formatClassNameAsLocalId(klass);
    default:
      return assertNever(showName, 'Unsupported show name type: ' + showName);
  }
}

function formatPropertyNameAsLabel(property: Property, localizer: Localizer) {
  return localizer.translate(property.label);
}

function formatPropertyNameAsId(property: Property) {
  return property.predicateId.compact;
}

function formatPropertyNameAsLocalId(property: Property) {
  return property.externalId || property.predicateId.compact;
}

function formatPropertyName(property: Property, showName: NameType, localizer: Localizer) {
  switch (showName) {
    case NameType.LABEL:
      return formatPropertyNameAsLabel(property, localizer);
    case NameType.ID:
      return formatPropertyNameAsId(property);
    case NameType.LOCAL_ID:
      return formatPropertyNameAsLocalId(property);
    default:
      return assertNever(showName, 'Unsupported show name type: ' + showName);
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

function formatAttributePropertyNameWithMetaData(propertyName: string, dataTypeName: string, cardinality: string) {
  return `- ${propertyName} : ${dataTypeName}${cardinality}`;
}

function formatAttributePropertyCardinality(showCardinality: boolean, attributeProperty: Property) {
  return showCardinality ? ` [${formatCardinality(attributeProperty)}]` : '';
}

export function formatAttributePropertyName(attributeProperty: Property, showCardinality: boolean, showName: NameType, localizer: Localizer): string {
  const propertyName = formatPropertyName(attributeProperty, showName, localizer);
  const dataTypeName = formatDataTypeName(attributeProperty.dataType, showName, localizer);
  const cardinality = formatAttributePropertyCardinality(showCardinality, attributeProperty);

  return formatAttributePropertyNameWithMetaData(propertyName, dataTypeName, cardinality);
}

export function formatCardinality(property: Property) {
  const min = property.minCount;
  const max = property.maxCount;

  if (!isDefined(min) && !isDefined(max)) {
    return '*';
  } else if (min === max) {
    return min!.toString();
  } else {
    return `${min || '0'}..${max || '*'}`;
  }
}

export function allClassNames(klass: VisualizationClass) {
  return [...Object.values(klass.label), formatClassNameAsId(klass), formatClassNameAsLocalId(klass)];
}

function allDataTypeNames(dataType: DataType|undefined, localizer: Localizer) {
  if (!dataType) {
    return [];
  } else {
    return [...localizer.allUILocalizationsForKey(dataType), formatDataTypeAsId(dataType)];
  }
}

function allPropertyNames(property: Property) {
  return [...Object.values(property.label), formatPropertyNameAsId(property), formatPropertyNameAsLocalId(property)];
}

export function allAttributePropertyNames(attributeProperty: Property, showCardinality: boolean, localizer: Localizer) {

  const cardinality = formatAttributePropertyCardinality(showCardinality, attributeProperty);
  const dataTypeNames = allDataTypeNames(attributeProperty.dataType, localizer);

  const result: string[] = [];

  for (const propertyName of allPropertyNames(attributeProperty)) {
    for (const dataTypeName of dataTypeNames) {
      result.push(formatAttributePropertyNameWithMetaData(propertyName, dataTypeName, cardinality));
    }
  }

  return result;
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
