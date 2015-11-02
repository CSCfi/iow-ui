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


module.exports = {
  withFullIRI
};
