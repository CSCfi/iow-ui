import { ClassService } from './classService';
import { ConceptService } from './conceptService';
import { EntityDeserializer } from './entities';
import { GroupService } from './groupService';
import { LanguageService } from './languageService';
import { LocationService } from './locationService';
import { ModelCache } from './modelCache';
import { ModelService } from './modelService';
import { PredicateService } from './predicateService';
import { SearchService } from './searchService';
import { UserService } from './userService';

const mod = angular.module('iow.services', []);
export = mod.name;

mod.service('classService', ClassService);
mod.service('conceptService', ConceptService);
mod.service('entities', EntityDeserializer);
mod.service('groupService', GroupService);
mod.service('languageService', LanguageService);
mod.service('locationService', LocationService);
mod.service('modelCache', ModelCache);
mod.service('modelService', ModelService);
mod.service('predicateService', PredicateService);
mod.service('searchService', SearchService);
mod.service('userService', UserService);
