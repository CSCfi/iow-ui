function withFullIRI(context, value) {
  const result = /^(\w+):(\w+)$/.exec(value);
  if (result) {
    const iri = context[result[1]];
    if (!iri) {
      throw new Error(`Prefix '${result[1]}' not found from context: \n ${JSON.stringify(context, null, 2)}`);
    } else {
      return iri + result[2];
    }
  } else {
    return value;
  }
}


module.exports = {
  withFullIRI
};
