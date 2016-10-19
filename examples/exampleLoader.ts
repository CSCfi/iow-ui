/// <reference types="node" />

import { ILogCall, ILogService, IQService } from 'angular';
import { EntityLoader } from '../src/services/entityLoader';
import { httpService } from './requestToAngularHttpService';
import { PredicateService } from '../src/services/predicateService';
import { DefaultModelService } from '../src/services/modelService';
import { ClassService } from '../src/services/classService';
import { UserService } from '../src/services/userService';
import { VocabularyService } from '../src/services/vocabularyService';
import { ResetService } from '../src/services/resetService';
import { FrameService } from '../src/services/frameService';

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
const frameService = new FrameService(log);
const modelService = new DefaultModelService(httpService, q, frameService);
const predicateService = new PredicateService(httpService, q, frameService);
const classService = new ClassService(httpService, q, predicateService, frameService);
const userService = new UserService(httpService, frameService);
const vocabularyService = new VocabularyService(httpService, frameService);
const resetService = new ResetService(httpService);


const context = {
  'skos' : 'http://www.w3.org/2004/02/skos/core#',
  'dc' : 'http://purl.org/dc/elements/1.1/',
  'schema' : 'http://schema.org/',
  'foaf' : 'http://xmlns.com/foaf/0.1/'
};


export const loader = new EntityLoader(q, httpService, modelService, predicateService, classService, userService, vocabularyService, resetService, context, true);
