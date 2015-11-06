function withFullIRI(context, value) {
  const parts = value && value.split(':');
  if (parts.length === 2) {
    const iri = context[parts[0]];
    if (!iri) {
      throw new Error(`Prefix '${parts[0]}' not found from context: \n ${JSON.stringify(context, null, 2)}`);
    } else {
      return iri + parts[1];
    }
  } else {
    return value;
  }
}

function asTypeString(objType) {
  if (objType === 'sh:ShapeClass') {
    return 'class';
  } else if (objType === 'owl:DatatypeProperty') {
    return 'attribute';
  } else if (objType === 'owl:ObjectProperty') {
    return 'association';
  } else {
    throw new Error('Unknown type: ' + objType);
  }
}


function asTypeAndId(obj) {
  if (obj) {
    return {type: type(obj), id: withFullId(obj)};
  }
}

function graph(obj) {
  if (obj) {
    return obj && obj['@graph'][0];
  }
}

function type(obj) {
  if (obj) {
    return asTypeString(graph(obj)['@type']);
  }
}

function withFullId(obj) {
  if (obj) {
    return withFullIRI(obj['@context'], graph(obj)['@id']);
  }
}

module.exports = {
  withFullIRI,
  withFullId,
  graph,
  type,
  asTypeString,
  asTypeAndId
};
