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

const logFn: angular.ILogCall = (...args: any[]) => console.log(args);
const log: angular.ILogService = { debug: logFn, error: logFn, info: logFn, log: logFn, warn: logFn };
const q = <angular.IQService> require('q');
const entityDeserializer = new EntityDeserializer(log);
const modelService = new ModelService(httpService, q, entityDeserializer);
const predicateService = new PredicateService(httpService, entityDeserializer);
const classService = new ClassService(httpService, q, predicateService, entityDeserializer);
const userService = new UserService(httpService, q, entityDeserializer);
const conceptService = new ConceptService(httpService, q, entityDeserializer);
const resetService = new ResetService(httpService);

export const loader = new EntityLoader(q, modelService, predicateService, classService, userService, conceptService, resetService, true);
