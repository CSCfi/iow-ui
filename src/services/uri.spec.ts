import { Uri } from './uri';

const context = {
  "label" : {
    "@id" : "http://www.w3.org/2000/01/rdf-schema#label",
    "@type" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString"
  },
  "created" : {
    "@id" : "http://purl.org/dc/terms/created",
    "@type" : "http://www.w3.org/2001/XMLSchema#dateTime"
  },
  "modified" : {
    "@id" : "http://purl.org/dc/terms/modified",
    "@type" : "http://www.w3.org/2001/XMLSchema#dateTime"
  },
  "schema" : "http://schema.org/",
  "dcap" : "http://purl.org/ws-mmi-dc/terms/",
  "void" : "http://rdfs.org/ns/void#",
  "adms" : "http://www.w3.org/ns/adms#",
  "dcam" : "http://purl.org/dc/dcam/",
  "owl" : "http://www.w3.org/2002/07/owl#",
  "foo" : "http://iow.csc.fi/ns/foo#",
  "afn" : "http://jena.hpl.hp.com/ARQ/function#",
  "xsd" : "http://www.w3.org/2001/XMLSchema#",
  "skos" : "http://www.w3.org/2004/02/skos/core#",
  "rdfs" : "http://www.w3.org/2000/01/rdf-schema#",
  "iow" : "http://iow.csc.fi/ns/iow#",
  "sd" : "http://www.w3.org/ns/sparql-service-description#",
  "sh" : "http://www.w3.org/ns/shacl#",
  "rdf" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "edu" : "http://iow.csc.fi/ns/edu#",
  "dcterms" : "http://purl.org/dc/terms/",
  "text" : "http://jena.apache.org/text#",
  "prov" : "http://www.w3.org/ns/prov#",
  "foaf" : "http://xmlns.com/foaf/0.1/",
  "ts" : "http://www.w3.org/2003/06/sw-vocab-status/ns#",
  "dc" : "http://purl.org/dc/elements/1.1/"
};


describe('Contextual URL with value as URL', () => {

  const nsPrefix = 'foaf';
  const ns = context.foaf;
  const name = 'Friend';
  const uri = new Uri(ns + name, context);

  it('compacts to curie',                           () => expect(uri.compact).toBe(nsPrefix + ':' + name));
  it('has curie',                                   () => expect(uri.curie).toBe(nsPrefix + ':' + name));
  it('has uri',                                     () => expect(uri.uri).toBe(ns + name));
  it('is url',                                      () => expect(uri.isUrl()).toBe(true));
  it('has url',                                     () => expect(uri.url).toBe(uri.uri));
  it('is not urn',                                  () => expect(uri.isUrn()).toBe(false));
  it('does not have urn',                           () => expect(uri.urn).toBeNull());
  it('has name',                                    () => expect(uri.name).toBe(name));
  it('has resolving namespace',                     () => expect(uri.namespaceResolves()).toBe(true));
  it('has namespace',                               () => expect(uri.namespace).toBe(ns));
  it('equals itself',                               () => expect(uri.equals(uri)).toBe(true));
  it('equals uri of itself',                        () => expect(uri.equals(new Uri(uri.uri, context))).toBe(true));
  it('equals curie of itself',                      () => expect(uri.equals(new Uri(uri.curie, context))).toBe(true));
  it('does not equal uri with different namespace', () => expect(uri.notEquals(new Uri(context.iow + name, context))).toBe(true));
  it('does not equal uri with different name',      () => expect(uri.notEquals(new Uri(ns + 'Enemy', context))).toBe(true));
  it('does not equal different uri',                () => expect(uri.notEquals(new Uri('http://www.google.com/Foo', context))).toBe(true));
  it('can return new instance within namespace',    () => expect(uri.withName('Enemy').equals(new Uri(ns + 'Enemy', context))).toBe(true));
});

describe('Contextual URL with value as curie', () => {

  const nsPrefix = 'foaf';
  const ns = context.foaf;
  const name = 'Friend';
  const uri = new Uri(nsPrefix + ':' + name, context);

  it('compacts to curie',                           () => expect(uri.compact).toBe(nsPrefix + ':' + name));
  it('has curie',                                   () => expect(uri.curie).toBe(nsPrefix + ':' + name));
  it('has uri',                                     () => expect(uri.uri).toBe(ns + name));
  it('is url',                                      () => expect(uri.isUrl()).toBe(true));
  it('has url',                                     () => expect(uri.url).toBe(uri.uri));
  it('is not urn',                                  () => expect(uri.isUrn()).toBe(false));
  it('does not have urn',                           () => expect(uri.urn).toBeNull());
  it('has name',                                    () => expect(uri.name).toBe(name));
  it('has resolving namespace',                     () => expect(uri.namespaceResolves()).toBe(true));
  it('has namespace',                               () => expect(uri.namespace).toBe(ns));
  it('equals itself',                               () => expect(uri.equals(uri)).toBe(true));
  it('equals uri of itself',                        () => expect(uri.equals(new Uri(uri.uri, context))).toBe(true));
  it('equals curie of itself',                      () => expect(uri.equals(new Uri(uri.curie, context))).toBe(true));
  it('does not equal uri with different namespace', () => expect(uri.notEquals(new Uri(context.iow + name, context))).toBe(true));
  it('does not equal uri with different name',      () => expect(uri.notEquals(new Uri(ns + 'Enemy', context))).toBe(true));
  it('does not equal different uri',                () => expect(uri.notEquals(new Uri('http://www.google.com/Foo', context))).toBe(true));
  it('can return new instance within namespace',    () => expect(uri.withName('Enemy').equals(new Uri(ns + 'Enemy', context))).toBe(true));
});

describe('Contextless URL with value as URL', () => {

  const notResolvingNs = 'http://www.example.org/';
  const name = 'Friend';
  const uri = new Uri(notResolvingNs + name, context);

  it('compacts to uri',                             () => expect(uri.compact).toBe(notResolvingNs + name));
  it('does not have curie',                         () => expect(() => uri.curie).toThrowError());
  it('has uri',                                     () => expect(uri.uri).toBe(notResolvingNs + name));
  it('is url',                                      () => expect(uri.isUrl()).toBe(true));
  it('has url',                                     () => expect(uri.url).toBe(uri.uri));
  it('is not urn',                                  () => expect(uri.isUrn()).toBe(false));
  it('does not have urn',                           () => expect(uri.urn).toBeNull());
  it('does not have name',                          () => expect(uri.name).toBe(name));
  it('does not have resolving namespace',           () => expect(uri.namespaceResolves()).toBe(false));
  it('has namespace',                               () => expect(uri.namespace).toBe(notResolvingNs));
  it('equals itself',                               () => expect(uri.equals(uri)).toBe(true));
  it('equals uri of itself',                        () => expect(uri.equals(new Uri(uri.uri, context))).toBe(true));
  it('does not equal uri with different namespace', () => expect(uri.notEquals(new Uri(context.iow + name, context))).toBe(true));
  it('does not equal uri with different name',      () => expect(uri.notEquals(new Uri(notResolvingNs + 'Enemy', context))).toBe(true));
  it('does not equal different uri',                () => expect(uri.notEquals(new Uri('http://www.google.com/Foo', context))).toBe(true));
  it('can return new instance within namespace',    () => expect(uri.withName('Enemy').equals(new Uri(notResolvingNs + 'Enemy', context))).toBe(true));
});

describe('Contextless URL with value as curie', () => {

  const unknownPrefix = 'example';
  const name = 'Friend';
  const uri = new Uri(unknownPrefix + ':' + name, context);

  it('compacts to curie',                           () => expect(uri.compact).toBe(unknownPrefix + ':' + name));
  it('has curie',                                   () => expect(uri.curie).toBe(unknownPrefix + ':' + name));
  it('does not have uri',                           () => expect(() => uri.uri).toThrowError());
  it('is url',                                      () => expect(uri.isUrl()).toBe(true));
  it('does not have url',                           () => expect(() => uri.url).toThrowError());
  it('is not urn',                                  () => expect(uri.isUrn()).toBe(false));
  it('does not have urn',                           () => expect(uri.urn).toBeNull());
  it('has name',                                    () => expect(uri.name).toBe(name));
  it('does not have resolving namespace',           () => expect(uri.namespaceResolves()).toBe(false));
  it('does not have namespace',                     () => expect(() => uri.namespace).toThrowError());
  it('equals does not work',                        () => expect(() => uri.equals(uri)).toThrowError());
  it('can return new instance within namespace',    () => expect(uri.withName('Enemy').curie === (unknownPrefix + ':' + 'Enemy')).toBe(true));
});

describe('URN value', () => {

  const uriValue = 'urn:uuid:537b150b-abbb-4364-9891-48431a7429e4';
  const uri = new Uri(uriValue, context);

  it('compacts to uri',                             () => expect(uri.compact).toBe(uriValue));
  it('does not have curie',                         () => expect(() => uri.curie).toThrowError());
  it('has uri',                                     () => expect(uri.uri).toBe(uriValue));
  it('is not url',                                  () => expect(uri.isUrl()).toBe(false));
  it('does not have url',                           () => expect(uri.url).toBeNull());
  it('is urn',                                      () => expect(uri.isUrn()).toBe(true));
  it('has urn',                                     () => expect(uri.urn).toBe(uriValue));
  it('does not have name',                          () => expect(() => uri.name).toThrowError());
  it('does not have resolving namespace',           () => expect(uri.namespaceResolves()).toBe(false));
  it('does not have namespace',                     () => expect(() => uri.namespace).toThrowError());
  it('equals itself',                               () => expect(uri.equals(uri)).toBe(true));
  it('equals uri of itself',                        () => expect(uri.equals(new Uri(uri.uri, context))).toBe(true));
  it('does not equal different url',                () => expect(uri.notEquals(new Uri('http://www.google.com/Foo', context))).toBe(true));
  it('does not equal different urn',                () => expect(uri.notEquals(new Uri('urn:uuid:61ecfdfb-030d-4be3-9f9d-2de0949f88e5', context))).toBe(true));
  it('cannot return new instance within namespace', () => expect(() => uri.withName('Enemy')).toThrowError());
});
