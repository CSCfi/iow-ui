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

function graph(obj) {
  return obj && obj['@graph'][0];
}

function type(obj) {
  return graph(obj)['@type'];
}

function withFullId(obj) {
  return withFullIRI(obj['@context'], graph(obj)['@id']);
}

module.exports = {
  withFullIRI,
  withFullId,
  graph,
  type
};
