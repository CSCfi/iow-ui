/// <reference types="node" />

import { ILogCall, ILogService, IQService } from 'angular';
import { EntityLoader } from '../src/services/entityLoader';
import { EntityDeserializer } from '../src/services/entities';
import { httpService } from './requestToAngularHttpService';
import { PredicateService } from '../src/services/predicateService';
import { ModelService } from '../src/services/modelService';
import { ClassService } from '../src/services/classService';
import { UserService } from '../src/services/userService';
import { ConceptService } from '../src/services/conceptService';
import { ResetService } from '../src/services/resetService';

const argv = require('optimist')
  .default({
    host: 'localhost',
    port: 8084
  })
  .argv;

process.env['API_ENDPOINT'] = `http://${argv.host}:${argv.port}/api`;

const logFn: ILogCall = (...args: any[]) => console.log(args);
const log: ILogService = { debug: logFn, error: logFn, info: logFn, log: logFn, warn: logFn };
const q = <IQService> require('q');
const entityDeserializer = new EntityDeserializer(log);
const modelService = new ModelService(httpService, q, entityDeserializer);
const predicateService = new PredicateService(httpService, q, entityDeserializer);
const classService = new ClassService(httpService, q, predicateService, entityDeserializer);
const userService = new UserService(httpService, entityDeserializer);
const conceptService = new ConceptService(httpService, entityDeserializer);
const resetService = new ResetService(httpService);


const context = {
  'skos' : 'http://www.w3.org/2004/02/skos/core#',
  'dc' : 'http://purl.org/dc/elements/1.1/',
  'schema' : 'http://schema.org/',
  'foaf' : 'http://xmlns.com/foaf/0.1/'
};


export const loader = new EntityLoader(q, httpService, modelService, predicateService, classService, userService, conceptService, resetService, context, true);
